"""Report generation for benchmark runs."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_run_report(run_dir: Path, run: dict[str, Any]) -> None:
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "run.json").write_text(json.dumps(run, indent=2, sort_keys=True), encoding="utf-8")
    lines = [
        f"# VibeHarnessBench Run {run['run_id']}",
        "",
        f"- Suite: `{run.get('suite_id')}`",
        f"- Adapter: `{run.get('adapter_id')}`",
        f"- Verdict counts: `{run.get('verdict_counts')}`",
        "",
        "## Cases",
    ]
    for family in run["family_results"]:
        lines.append(f"\n### {family['family_id']} (score {family['score']:.2f})")
        for case in family["cases"]:
            lines.append(
                f"- `{case['case_id']}` seed `{case['seed']}`: **{case['verdict']}** "
                f"visible={case.get('visible', {}).get('verdict')} hidden={case.get('hidden', {}).get('verdict')} "
                f"infra_error={case['infra_error']} artifacts=`{case['artifact_dir']}`"
            )
    (run_dir / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def group_case_results(case_results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for result in case_results:
        grouped.setdefault(result["family_id"], []).append(result)
    families = []
    for family_id, cases in grouped.items():
        score = sum(1 for c in cases if c["verdict"] == "PASS") / len(cases)
        families.append({"family_id": family_id, "score": score, "cases": cases})
    return families


def verdict_counts(case_results: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for result in case_results:
        counts[result["verdict"]] = counts.get(result["verdict"], 0) + 1
    return counts
