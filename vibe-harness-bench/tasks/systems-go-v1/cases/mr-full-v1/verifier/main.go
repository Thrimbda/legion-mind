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

const visibleTest = `package mrbench

import "testing"

func TestWordCountAndDeterministicOutput(t *testing.T) {
	result := RunScenario("normal")
	if result.Counts["bike"] != 2 || result.Counts["pelican"] != 1 || result.Counts["worker"] != 3 {
		t.Fatalf("unexpected word counts: %#v", result.Counts)
	}
	if len(result.Outputs) != 3 || result.Outputs[0] != "bike 2" || result.Outputs[1] != "pelican 1" || result.Outputs[2] != "worker 3" {
		t.Fatalf("outputs are not deterministic sorted reduce output: %#v", result.Outputs)
	}
}
`

const hiddenTest = visibleTest + `
func TestLeaseReassignmentAndLateCompletion(t *testing.T) {
	result := RunScenario("straggler")
	if !result.Reassigned {
		t.Fatalf("lease timeout did not trigger reassignment")
	}
	if !result.LateIgnored {
		t.Fatalf("late completion from original worker was committed")
	}
	if result.DuplicateCommits != 0 {
		t.Fatalf("duplicate commits polluted output: %d", result.DuplicateCommits)
	}
}

func TestCrashRecoveryAndParallelism(t *testing.T) {
	result := RunScenario("crashy")
	if !result.Recovered {
		t.Fatalf("crashy worker prevented job completion")
	}
	if result.MaxConcurrent < 2 {
		t.Fatalf("parallelism signal missing: max concurrent workers = %d", result.MaxConcurrent)
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
	verifyRoot, err := os.MkdirTemp("", "vbh-mr-verify-")
	if err != nil {
		emit("ERROR_INFRA", fmt.Sprintf("make verifier temp: %v", err))
		os.Exit(2)
	}
	defer os.RemoveAll(verifyRoot)
	if err := copyTree(workspace, verifyRoot); err != nil {
		emit("ERROR_INFRA", fmt.Sprintf("copy workspace: %v", err))
		os.Exit(2)
	}
	testPath := filepath.Join(verifyRoot, "vbh_semantics_test.go")
	if err := os.WriteFile(testPath, []byte(testBody), 0o644); err != nil {
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
	emit("PASS", "MR clean-room simulator semantics passed")
}
