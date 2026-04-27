package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
)

const visibleTest = `package kvbench

import "testing"

func TestVersionedPutGet(t *testing.T) {
	s := NewStore()
	if _, _, err := s.Get("missing"); err != ErrNoKey {
		t.Fatalf("missing key error = %v", err)
	}
	if err := s.Put("bird", "pelican", 0); err != OK {
		t.Fatalf("create put failed: %v", err)
	}
	value, version, err := s.Get("bird")
	if err != OK || value != "pelican" || version != 1 {
		t.Fatalf("get after put = %q %d %v", value, version, err)
	}
	if err := s.Put("bird", "bike", 0); err != ErrVersion {
		t.Fatalf("version mismatch error = %v", err)
	}
}
`

const hiddenTest = visibleTest + `
func TestAmbiguousRetryAndDuplicates(t *testing.T) {
	s := NewStore()
	if err := s.Put("k", "v1", 0); err != OK {
		t.Fatalf("initial put failed: %v", err)
	}
	if err := s.RetryPutAmbiguous("k", "v2", 1); err != ErrMaybe {
		t.Fatalf("ambiguous retry should return ErrMaybe, got %v", err)
	}
	value, version, err := s.Get("k")
	if err != OK || value != "v2" || version != 2 {
		t.Fatalf("ambiguous put should apply exactly once, got %q %d %v", value, version, err)
	}
	if !s.DuplicateDelayedSafe() {
		t.Fatalf("duplicate or delayed replies corrupt state")
	}
}

func TestConcurrentHistoryModel(t *testing.T) {
	if !ConcurrentHistoryLinearizable() {
		t.Fatalf("externally observed concurrent history is not linearizable")
	}
}
`

func emit(verdict, reason string) {
	_ = json.NewEncoder(os.Stdout).Encode(map[string]string{"verdict": verdict, "reason": reason})
}

func copyTree(src, dst string) error {
	return filepath.WalkDir(src, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil || rel == "." {
			return err
		}
		target := filepath.Join(dst, rel)
		if entry.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		in, err := os.Open(path)
		if err != nil {
			return err
		}
		defer in.Close()
		out, err := os.Create(target)
		if err != nil {
			return err
		}
		defer out.Close()
		_, err = io.Copy(out, in)
		return err
	})
}

func main() {
	visible := flag.Bool("visible", false, "run visible subset")
	flag.Parse()
	workspace := os.Getenv("VBH_WORKSPACE_DIR")
	if workspace == "" {
		emit("ERROR_INFRA", "missing VBH_WORKSPACE_DIR")
		os.Exit(2)
	}
	testBody := hiddenTest
	if *visible {
		testBody = visibleTest
	}
	verifyRoot, err := os.MkdirTemp("", "vbh-kv-verify-")
	if err != nil {
		emit("ERROR_INFRA", fmt.Sprintf("make verifier temp: %v", err))
		os.Exit(2)
	}
	defer os.RemoveAll(verifyRoot)
	if err := copyTree(workspace, verifyRoot); err != nil {
		emit("ERROR_INFRA", fmt.Sprintf("copy workspace: %v", err))
		os.Exit(2)
	}
	if err := os.WriteFile(filepath.Join(verifyRoot, "vbh_semantics_test.go"), []byte(testBody), 0o644); err != nil {
		emit("ERROR_INFRA", fmt.Sprintf("write test: %v", err))
		os.Exit(2)
	}
	cmd := exec.Command("go", "test", ".")
	cmd.Dir = verifyRoot
	out, err := cmd.CombinedOutput()
	if err != nil {
		emit("FAIL_HIDDEN", string(out))
		os.Exit(1)
	}
	emit("PASS", "KV clean-room simulator semantics passed")
}
