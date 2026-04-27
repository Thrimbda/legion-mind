"""Benchmark run engine."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import tempfile
import uuid

from bench.runner.isolation import (
    assert_visible_env_no_protected_paths,
    make_adapter_env,
    materialize_hut_workspace,
    persist_hut_artifacts,
)
from bench.runner.reporting import group_case_results, verdict_counts, write_run_report
from bench.runner.schema import ROOT, Case, load_adapter, select_cases
from bench.runner.verifier_exec import final_verdict, run_verifier, runtime_info


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _seed_for(case: Case, explicit: int | None) -> int:
    if explicit is not None:
        return explicit
    if case.gate_seeds:
        return int(case.gate_seeds[0])
    return 1


def _base_adapter_process_env() -> dict[str, str]:
    """Keep only generic process env, avoiding repo-derived paths like PWD/PYTHONPATH."""
    allowed = {"PATH", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR", "TEMP", "TMP"}
    env = {key: value for key, value in os.environ.items() if key in allowed or key.startswith("LC_")}
    if "PATH" in env:
        safe_entries = []
        for entry in env["PATH"].split(os.pathsep):
            if not entry:
                continue
            candidate = Path(entry)
            if candidate.is_absolute() and (candidate.resolve() == ROOT.resolve() or ROOT.resolve() in candidate.resolve().parents):
                continue
            safe_entries.append(entry)
        env["PATH"] = os.pathsep.join(safe_entries)
    return env


def _run_one(case: Case, adapter, run_dir: Path, seed: int) -> dict[str, object]:
    case_run_dir = run_dir / "cases" / case.family_id / case.id
    adapter_error = None
    with tempfile.TemporaryDirectory(prefix="vbh-hut-") as execution_root_text:
        visible = materialize_hut_workspace(case, Path(execution_root_text), seed)
        env = _base_adapter_process_env()
        env.update(make_adapter_env(case, seed, visible))
        assert_visible_env_no_protected_paths(case, env)
        try:
            completed = subprocess.run(
                adapter.command,
                cwd=visible["workspace"],
                env=env,
                text=True,
                capture_output=True,
                timeout=max(1, int(case.budgets.get("wall_time_sec", 30))) + adapter.timeout_grace_sec,
            )
            stdout = completed.stdout
            stderr = completed.stderr
            if completed.returncode != 0:
                adapter_error = f"adapter exited {completed.returncode}"
        except (OSError, subprocess.TimeoutExpired) as exc:
            stdout = getattr(exc, "stdout", "") or ""
            stderr = getattr(exc, "stderr", "") or ""
            adapter_error = f"adapter error: {exc}"
        visible_result = run_verifier(case, "visible", Path(visible["workspace"]), Path(visible["artifacts"]), seed) if not adapter_error else {"phase": "visible", "verdict": "SKIPPED", "infra_error": False, "reason": "adapter failed", "duration_ms": 0}
        hidden_result = run_verifier(case, "hidden", Path(visible["workspace"]), Path(visible["artifacts"]), seed) if not adapter_error else {"phase": "hidden", "verdict": "SKIPPED", "infra_error": False, "reason": "adapter failed", "duration_ms": 0}
        verdict, infra_error, reason = final_verdict(adapter_error, visible_result, hidden_result)
        persisted = persist_hut_artifacts(visible, case_run_dir)
        (case_run_dir / "adapter.stdout.txt").write_text(stdout, encoding="utf-8")
        (case_run_dir / "adapter.stderr.txt").write_text(stderr, encoding="utf-8")
    return {
        "family_id": case.family_id,
        "case_id": case.id,
        "seed": seed,
        "verdict": verdict,
        "infra_error": infra_error,
        "reason": reason,
        "visible": visible_result,
        "hidden": hidden_result,
        "runtime": runtime_info(case),
        "mvp_status": case.mvp_status,
        "artifact_dir": str(persisted["artifacts"]),
        "workspace_dir": str(persisted["workspace"]),
        "visible_inputs": {
            "prompt": str(persisted["prompt"]),
            "public": str(persisted["public"]),
            "checksums": persisted["checksums"],
        },
    }


def run_benchmark(args) -> int:
    adapter = load_adapter(args.adapter)
    cases = select_cases(suite=args.suite, family=args.family, case=args.case)
    run_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    run_dir = ROOT / "results" / run_id
    started = _now()
    case_results = [_run_one(case, adapter, run_dir, _seed_for(case, args.seed)) for case in cases]
    ended = _now()
    run = {
        "schema_version": "vbh.run.v1",
        "run_id": run_id,
        "suite_id": args.suite,
        "adapter_id": adapter.id,
        "adapter_path": str(adapter.path),
        "started_at": started,
        "ended_at": ended,
        "verdict_counts": verdict_counts(case_results),
        "family_results": group_case_results(case_results),
    }
    write_run_report(run_dir, run)
    print(run_dir)
    return 0
