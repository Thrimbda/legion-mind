"""MVP deterministic contract verifier."""

from __future__ import annotations

import json
from pathlib import Path

from bench.runner.schema import Case


def verify_contract(case: Case, artifact_dir: Path) -> dict[str, object]:
    contract_path = artifact_dir / "contract.json"
    if not contract_path.exists():
        return {"verdict": "FAIL_HIDDEN", "infra_error": False, "reason": "missing artifacts/contract.json"}
    try:
        data = json.loads(contract_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return {"verdict": "FAIL_HIDDEN", "infra_error": False, "reason": f"invalid contract json: {exc}"}
    if data.get("schema") != "vbh.contract.v1":
        return {"verdict": "FAIL_HIDDEN", "infra_error": False, "reason": "schema mismatch"}
    if data.get("case_id") != case.id:
        return {"verdict": "FAIL_HIDDEN", "infra_error": False, "reason": "case_id mismatch"}
    markers = set(data.get("capability_markers", []))
    missing = [marker for marker in case.required_markers if marker not in markers]
    if missing:
        return {"verdict": "FAIL_HIDDEN", "infra_error": False, "reason": f"missing markers: {', '.join(missing)}"}
    return {"verdict": "PASS", "infra_error": False, "reason": "contract satisfied"}
