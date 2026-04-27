"""Protected selfcheck for oracle and negative controls."""

from __future__ import annotations

from datetime import datetime, timezone
import json
import shutil
import tempfile
from pathlib import Path

from bench.runner.schema import Case, ROOT, select_cases
from bench.runner.verifier_exec import run_verifier


def _copy_protected(src: Path, dst: Path) -> Path:
    shutil.copytree(src, dst, dirs_exist_ok=True)
    return dst


def _check_oracle(case: Case, temp_root: Path) -> dict[str, object]:
    workspace = _copy_protected(case.oracle_dir, temp_root / case.family_id / case.id / "oracle")
    result = run_verifier(case, "hidden", workspace, workspace / "artifacts", seed=case.gate_seeds[0] if case.gate_seeds else 1)
    return {"kind": "oracle", "id": "oracle", "expected": "PASS", "actual": result["verdict"], "infra_error": result["infra_error"], "reason": result["reason"], "protected_workspace": str(workspace)}


def _check_negative(case: Case, temp_root: Path, neg_dir: Path) -> dict[str, object]:
    workspace = _copy_protected(neg_dir, temp_root / case.family_id / case.id / "negative" / neg_dir.name)
    result = run_verifier(case, "hidden", workspace, workspace / "artifacts", seed=case.gate_seeds[0] if case.gate_seeds else 1)
    return {"kind": "negative", "id": neg_dir.name, "expected": "FAIL_HIDDEN", "actual": result["verdict"], "infra_error": result["infra_error"], "reason": result["reason"], "protected_workspace": str(workspace)}


def run_selfcheck(args) -> int:
    cases = select_cases(suite=args.suite, family=args.family, case=args.case)
    started = datetime.now(timezone.utc).isoformat()
    results = []
    with tempfile.TemporaryDirectory(prefix="vbh-selfcheck-") as tmp:
        temp_root = Path(tmp)
        for case in cases:
            case_results = [_check_oracle(case, temp_root)]
            configured = case.selfcheck.get("negative_controls") or []
            neg_dirs = [case.path / item.get("workspace_dir", "") for item in configured] if configured else [p for p in sorted(case.negative_dir.iterdir()) if p.is_dir()]
            for neg in neg_dirs:
                if neg.is_dir():
                    case_results.append(_check_negative(case, temp_root, neg))
            negatives = [r for r in case_results if r["kind"] == "negative"]
            ok = case_results[0]["actual"] == "PASS" and bool(negatives) and all(r["actual"] == "FAIL_HIDDEN" and not r["infra_error"] for r in negatives)
            results.append({"family_id": case.family_id, "case_id": case.id, "mvp_status": case.mvp_status, "ok": ok, "checks": case_results})
    report = {"schema_version": "vbh.selfcheck.v1", "started_at": started, "ended_at": datetime.now(timezone.utc).isoformat(), "suite_id": args.suite, "results": results}
    out_dir = ROOT / "results" / "selfcheck-last"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "selfcheck.json").write_text(json.dumps(report, indent=2, sort_keys=True), encoding="utf-8")
    for item in results:
        print(f"{item['family_id']}/{item['case_id']}: {'PASS' if item['ok'] else 'FAIL'}")
        for check in item["checks"]:
            print(f"  {check['kind']}:{check['id']} expected={check['expected']} actual={check['actual']} infra_error={check['infra_error']}")
    return 0 if all(item["ok"] for item in results) else 1
