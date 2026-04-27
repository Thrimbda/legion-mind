"""Compare two VibeHarnessBench run directories."""

from __future__ import annotations

import json
from pathlib import Path


def _load(run_dir: str) -> dict:
    path = Path(run_dir) / "run.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _cases(run: dict) -> dict[str, dict]:
    out = {}
    for family in run.get("family_results", []):
        for case in family.get("cases", []):
            out[f"{family['family_id']}/{case['case_id']}"] = {**case, "score": family.get("score", 0.0)}
    return out


def compare_runs(args) -> int:
    left = _load(args.left)
    right = _load(args.right)
    left_cases = _cases(left)
    right_cases = _cases(right)
    print(f"left={left['run_id']} adapter={left.get('adapter_id')}")
    print(f"right={right['run_id']} adapter={right.get('adapter_id')}")
    print("case | final | visible | hidden | score | infra_error")
    for key in sorted(set(left_cases) | set(right_cases)):
        l = left_cases.get(key, {})
        r = right_cases.get(key, {})
        print(f"{key} | {l.get('verdict')} -> {r.get('verdict')} | {l.get('visible', {}).get('verdict')} -> {r.get('visible', {}).get('verdict')} | {l.get('hidden', {}).get('verdict')} -> {r.get('hidden', {}).get('verdict')} | {l.get('score')} -> {r.get('score')} | {l.get('infra_error')} -> {r.get('infra_error')}")
    return 0
