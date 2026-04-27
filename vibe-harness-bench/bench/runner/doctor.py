"""Doctor checks for VibeHarnessBench v0.1."""

from __future__ import annotations

import sys
import tempfile
import shutil
from pathlib import Path

from bench.runner.isolation import (
    assert_execution_root_outside_project,
    assert_no_protected_visible,
    assert_visible_env_no_protected_paths,
    make_adapter_env,
    materialize_hut_workspace,
)
from bench.runner.schema import ROOT, MetadataError, load_adapter, load_all_cases, load_all_suites, load_family


REQUIRED_DIRS = ["starter", "public", "verifier", "oracle", "negative_controls", "docs"]


def run_doctor() -> int:
    failures: list[str] = []
    print(f"python: {sys.version.split()[0]}")
    if sys.version_info < (3, 10):
        failures.append("Python >= 3.10 required")
    try:
        suites = load_all_suites()
        print(f"suites: {', '.join(s.id for s in suites)}")
        cases = load_all_cases()
        by_key = {(c.family_id, c.id): c for c in cases}
        for suite in suites:
            for ref in suite.cases:
                if (ref["family_id"], ref["case_id"]) not in by_key:
                    failures.append(f"suite {suite.id} references missing case {ref}")
        for case in cases:
            family = load_family(case.family_id)
            if case.id not in family.cases:
                failures.append(f"family {family.id} does not list case {case.id}")
            for dirname in REQUIRED_DIRS:
                if not (case.path / dirname).is_dir():
                    failures.append(f"missing {dirname}: {case.path}")
            if not case.prompt_path.is_file() or not (case.path / "task.yaml").is_file():
                failures.append(f"missing task.yaml or prompt.md: {case.path}")
            if not case.visible_verify_cmd or not case.hidden_verify_cmd:
                failures.append(f"missing visible/hidden verifier command: {case.path}")
            for cmd_name, cmd in (("visible", case.visible_verify_cmd), ("hidden", case.hidden_verify_cmd)):
                if cmd and shutil.which(cmd[0]) is None:
                    failures.append(f"{case.id} {cmd_name} verifier runtime not found: {cmd[0]}")
            for req in case.runtime.get("requires", []):
                if shutil.which(str(req)) is None:
                    failures.append(f"{case.id} missing required runtime: {req}")
            with tempfile.TemporaryDirectory(prefix="vbh-doctor-hut-") as execution_root_text:
                execution_root = Path(execution_root_text)
                assert_execution_root_outside_project(execution_root)
                visible = materialize_hut_workspace(case, execution_root, seed=1)
                assert_no_protected_visible(case, visible)
                assert_visible_env_no_protected_paths(case, make_adapter_env(case, 1, visible))
        try:
            assert_execution_root_outside_project(ROOT / "results" / "doctor-in-repo")
            failures.append("in-repo HUT execution root guard did not fail")
        except RuntimeError:
            pass
        adapter = load_adapter(str(ROOT / "bench" / "adapters" / "examples" / "noop.yaml"))
        print(f"adapter: {adapter.id}")
    except (MetadataError, RuntimeError, OSError, KeyError) as exc:
        failures.append(str(exc))
    if failures:
        print("doctor: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print("doctor: PASS")
    return 0
