"""Visible/hidden verifier command execution for semantic v0.1 cases."""

from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import time
from typing import Any

from bench.runner.contract import verify_contract
from bench.runner.schema import Case, ROOT


def runtime_info(case: Case) -> dict[str, Any]:
    info: dict[str, Any] = {"requires": list(case.runtime.get("requires", [])), "blocked": False, "missing": []}
    for name in info["requires"]:
        exe = shutil.which(str(name))
        if not exe:
            info["missing"].append(name)
            continue
        try:
            cmd = [str(name), "--version"] if name == "node" else [str(name), "version"] if name == "go" else [str(name), "--version"]
            cp = subprocess.run(cmd, text=True, capture_output=True, timeout=5)
            info[str(name)] = (cp.stdout or cp.stderr).strip().splitlines()[0] if (cp.stdout or cp.stderr).strip() else exe
        except Exception as exc:  # pragma: no cover - diagnostic only
            info[str(name)] = f"{exe} ({exc})"
    info["blocked"] = bool(info["missing"])
    return info


def _safe_env(case: Case, workspace: Path, artifact_dir: Path, seed: int, phase: str) -> dict[str, str]:
    allowed = {"PATH", "LANG", "LC_ALL", "LC_CTYPE", "TMPDIR", "TEMP", "TMP", "HOME"}
    env = {k: v for k, v in os.environ.items() if k in allowed or k.startswith("LC_")}
    env.update({
        "VBH_CASE_ID": case.id,
        "VBH_FAMILY_ID": case.family_id,
        "VBH_WORKSPACE_DIR": str(workspace),
        "VBH_ARTIFACT_DIR": str(artifact_dir),
        "VBH_TASK_SEED": str(seed),
        "VBH_VERIFY_PHASE": phase,
    })
    return env


def run_verifier(case: Case, phase: str, workspace: Path, artifact_dir: Path, seed: int) -> dict[str, Any]:
    cmd = case.visible_verify_cmd if phase == "visible" else case.hidden_verify_cmd
    started = time.monotonic()
    if not cmd:
        # Compatibility only for old task packs; v0.1 task.yaml files must not rely on this.
        check = verify_contract(case, artifact_dir)
        return {"phase": phase, "verdict": check["verdict"], "infra_error": check["infra_error"], "reason": f"compat contract verifier: {check['reason']}", "duration_ms": int((time.monotonic() - started) * 1000), "stdout": "", "stderr": ""}
    info = runtime_info(case)
    if info["blocked"]:
        return {"phase": phase, "verdict": "ERROR_INFRA", "infra_error": True, "reason": "missing runtime: " + ", ".join(info["missing"]), "duration_ms": 0, "stdout": "", "stderr": ""}
    timeout = int(case.budgets.get("verifier_wall_time_sec", 60))
    try:
        cp = subprocess.run(cmd, cwd=case.path, env=_safe_env(case, workspace, artifact_dir, seed, phase), text=True, capture_output=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"phase": phase, "verdict": "ERROR_INFRA", "infra_error": True, "reason": f"verifier execution error: {exc}", "duration_ms": int((time.monotonic() - started) * 1000), "stdout": getattr(exc, "stdout", "") or "", "stderr": getattr(exc, "stderr", "") or ""}
    verdict = "PASS" if cp.returncode == 0 else ("FAIL_VISIBLE" if phase == "visible" else "FAIL_HIDDEN")
    reason = "ok" if cp.returncode == 0 else (cp.stderr.strip().splitlines()[-1] if cp.stderr.strip() else cp.stdout.strip().splitlines()[-1] if cp.stdout.strip() else f"exit {cp.returncode}")
    # A verifier may print a JSON object on its last stdout line with a clearer reason/verdict.
    for line in reversed(cp.stdout.splitlines()):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            reason = str(data.get("reason", reason))
            if data.get("verdict") in {"PASS", "FAIL_VISIBLE", "FAIL_HIDDEN", "ERROR_INFRA"}:
                verdict = str(data["verdict"])
            break
    if phase == "visible" and verdict == "FAIL_HIDDEN":
        verdict = "FAIL_VISIBLE"
    return {"phase": phase, "verdict": verdict, "infra_error": verdict == "ERROR_INFRA", "reason": reason, "duration_ms": int((time.monotonic() - started) * 1000), "stdout": cp.stdout[-4000:], "stderr": cp.stderr[-4000:]}


def final_verdict(adapter_error: str | None, visible: dict[str, Any], hidden: dict[str, Any]) -> tuple[str, bool, str]:
    if adapter_error:
        return "ERROR_AGENT", False, adapter_error
    for result in (visible, hidden):
        if result.get("verdict") == "ERROR_INFRA":
            return "ERROR_INFRA", True, str(result.get("reason", "infra error"))
    if visible.get("verdict") != "PASS":
        return "FAIL_VISIBLE", False, str(visible.get("reason", "visible failed"))
    if hidden.get("verdict") != "PASS":
        return "FAIL_HIDDEN", False, str(hidden.get("reason", "hidden failed"))
    return "PASS", False, "visible and hidden verifiers passed"
