"""Allowlisted materialization for HUT-visible workspaces."""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

from bench.runner.schema import ROOT, Case


PROTECTED_NAMES = {"verifier", "oracle", "negative_controls"}


def _is_relative_to(path: Path, parent: Path) -> bool:
    path = path.resolve()
    parent = parent.resolve()
    return path == parent or parent in path.parents


def checksum_tree(path: Path) -> str:
    h = hashlib.sha256()
    if path.is_file():
        h.update(path.name.encode())
        h.update(path.read_bytes())
        return h.hexdigest()
    for item in sorted(path.rglob("*")):
        if item.is_file():
            h.update(str(item.relative_to(path)).encode())
            h.update(item.read_bytes())
    return h.hexdigest()


def _copytree_contents(src: Path, dst: Path) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    for child in src.iterdir():
        target = dst / child.name
        if child.is_dir():
            shutil.copytree(child, target, dirs_exist_ok=True)
        else:
            shutil.copy2(child, target)


def assert_execution_root_outside_project(execution_root: Path) -> None:
    """Reject HUT execution roots inside the benchmark project tree."""
    if _is_relative_to(execution_root, ROOT):
        raise RuntimeError(f"HUT execution root must be outside benchmark project root: {execution_root}")


def materialize_hut_workspace(case: Case, execution_root: Path, seed: int) -> dict[str, Path | dict[str, str]]:
    assert_execution_root_outside_project(execution_root)
    workspace = execution_root / "workspace"
    inputs = execution_root / "visible_inputs"
    artifacts = execution_root / "artifacts"
    workspace.mkdir(parents=True, exist_ok=True)
    inputs.mkdir(parents=True, exist_ok=True)
    artifacts.mkdir(parents=True, exist_ok=True)

    _copytree_contents(case.starter_dir, workspace)
    prompt_copy = inputs / "prompt.md"
    shutil.copy2(case.prompt_path, prompt_copy)
    public_copy = inputs / "public"
    shutil.copytree(case.public_dir, public_copy, dirs_exist_ok=True)
    budget_file = inputs / "budget.json"
    budget_file.write_text(json.dumps({"seed": seed, "budgets": case.budgets}, indent=2), encoding="utf-8")

    paths: dict[str, Path | dict[str, str]] = {
        "workspace": workspace,
        "prompt": prompt_copy,
        "public": public_copy,
        "artifacts": artifacts,
        "budget": budget_file,
        "summary": artifacts / "summary.json",
        "trace": artifacts / "trace.jsonl",
        "checksums": {
            "starter": checksum_tree(workspace),
            "prompt": checksum_tree(prompt_copy),
            "public": checksum_tree(public_copy),
        },
    }
    assert_no_protected_visible(case, paths)
    return paths


def persist_hut_artifacts(visible: dict[str, Path | dict[str, str]], case_run_dir: Path) -> dict[str, Path | dict[str, str]]:
    """Copy HUT-visible execution artifacts back into results for reporting."""
    case_run_dir.mkdir(parents=True, exist_ok=True)
    persisted = {
        "workspace": case_run_dir / "workspace",
        "prompt": case_run_dir / "visible_inputs" / "prompt.md",
        "public": case_run_dir / "visible_inputs" / "public",
        "artifacts": case_run_dir / "artifacts",
        "budget": case_run_dir / "visible_inputs" / "budget.json",
        "summary": case_run_dir / "artifacts" / "summary.json",
        "trace": case_run_dir / "artifacts" / "trace.jsonl",
        "checksums": visible["checksums"],
    }
    for key in ("workspace", "public", "artifacts"):
        dst = persisted[key]
        if isinstance(dst, Path) and dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(Path(visible[key]), dst)  # type: ignore[arg-type]
    for key in ("prompt", "budget"):
        dst = persisted[key]
        if isinstance(dst, Path):
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(Path(visible[key]), dst)  # type: ignore[arg-type]
    return persisted


def assert_no_protected_visible(case: Case, visible: dict[str, object]) -> None:
    protected = [case.verifier_dir.resolve(), case.oracle_dir.resolve(), case.negative_dir.resolve(), case.path.resolve()]
    for key, value in visible.items():
        if key == "checksums":
            continue
        candidate = Path(value).resolve()  # type: ignore[arg-type]
        for blocked in protected:
            if candidate == blocked or blocked in candidate.parents:
                raise RuntimeError(f"protected path leaked through visible {key}: {candidate}")
        for part in candidate.parts:
            if part in PROTECTED_NAMES:
                raise RuntimeError(f"protected directory name leaked through visible {key}: {candidate}")


def assert_visible_env_no_protected_paths(case: Case, env: dict[str, str]) -> None:
    protected = [ROOT.resolve(), case.verifier_dir.resolve(), case.oracle_dir.resolve(), case.negative_dir.resolve(), case.path.resolve()]
    for key, value in env.items():
        if not value:
            continue
        for token in value.split(":"):
            candidate = Path(token).expanduser()
            if not candidate.is_absolute():
                continue
            try:
                resolved = candidate.resolve()
            except OSError:
                resolved = candidate.absolute()
            for blocked in protected:
                if _is_relative_to(resolved, blocked):
                    raise RuntimeError(f"protected path leaked through adapter env {key}: {resolved}")


def make_adapter_env(case: Case, seed: int, visible: dict[str, object]) -> dict[str, str]:
    env = {
        "BENCH_TASK_FAMILY_ID": case.family_id,
        "BENCH_CASE_ID": case.id,
        "BENCH_TASK_SEED": str(seed),
        "BENCH_PROMPT_FILE": str(visible["prompt"]),
        "BENCH_PUBLIC_DIR": str(visible["public"]),
        "BENCH_WORKSPACE_DIR": str(visible["workspace"]),
        "BENCH_ARTIFACT_DIR": str(visible["artifacts"]),
        "BENCH_BUDGET_FILE": str(visible["budget"]),
        "BENCH_SUMMARY_OUT": str(visible["summary"]),
        "BENCH_TRACE_OUT": str(visible["trace"]),
    }
    assert_visible_env_no_protected_paths(case, env)
    return env
