"""Metadata loading for suites, families, cases, and adapters."""

from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
TASKS_DIR = ROOT / "tasks"
SUITES_DIR = ROOT / "bench" / "suites"


class MetadataError(RuntimeError):
    pass


def load_json_yaml(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise MetadataError(f"{path}: MVP YAML must be JSON-compatible: {exc}") from exc


@dataclass(frozen=True)
class Suite:
    id: str
    description: str
    cases: list[dict[str, Any]]


@dataclass(frozen=True)
class Family:
    id: str
    name: str
    cases: list[str]
    path: Path


@dataclass(frozen=True)
class Case:
    id: str
    family_id: str
    kind: str
    language_stack: list[str]
    mvp_status: str
    budgets: dict[str, Any]
    gate_seeds: list[int]
    nightly_seeds: list[int]
    required_markers: list[str]
    verifier: dict[str, Any]
    visible_verify_cmd: list[str]
    hidden_verify_cmd: list[str]
    runtime: dict[str, Any]
    selfcheck: dict[str, Any]
    path: Path
    metadata: dict[str, Any]

    @property
    def prompt_path(self) -> Path:
        return self.path / "prompt.md"

    @property
    def starter_dir(self) -> Path:
        return self.path / self.metadata["starter_dir"]

    @property
    def public_dir(self) -> Path:
        return self.path / self.metadata["public_dir"]

    @property
    def verifier_dir(self) -> Path:
        return self.path / self.metadata["protected_verifier_dir"]

    @property
    def oracle_dir(self) -> Path:
        return self.path / self.metadata["protected_oracle_dir"]

    @property
    def negative_dir(self) -> Path:
        return self.path / self.metadata["protected_negative_controls_dir"]


@dataclass(frozen=True)
class Adapter:
    id: str
    mode: str
    command: list[str]
    timeout_grace_sec: int
    supports_metrics: bool
    path: Path


def load_suite(suite_id: str) -> Suite:
    path = SUITES_DIR / f"{suite_id}.yaml"
    if not path.exists():
        raise MetadataError(f"suite not found: {suite_id}")
    data = load_json_yaml(path)
    return Suite(id=data["id"], description=data.get("description", ""), cases=list(data["cases"]))


def load_all_suites() -> list[Suite]:
    return [load_suite(path.stem) for path in sorted(SUITES_DIR.glob("*.yaml"))]


def load_family(family_id: str) -> Family:
    family_path = TASKS_DIR / family_id
    data = load_json_yaml(family_path / "family.yaml")
    return Family(id=data["id"], name=data.get("name", data["id"]), cases=list(data["cases"]), path=family_path)


def load_case(family_id: str, case_id: str) -> Case:
    case_path = TASKS_DIR / family_id / "cases" / case_id
    data = load_json_yaml(case_path / "task.yaml")
    if data["id"] != case_id or data["family_id"] != family_id:
        raise MetadataError(f"case id mismatch in {case_path / 'task.yaml'}")
    return Case(
        id=data["id"],
        family_id=data["family_id"],
        kind=data["kind"],
        language_stack=list(data.get("language_stack", [])),
        mvp_status=data["mvp_status"],
        budgets=dict(data.get("budgets", {})),
        gate_seeds=list(data.get("gate_seeds", [])),
        nightly_seeds=list(data.get("nightly_seeds", [])),
        required_markers=list(data.get("required_markers", [])),
        verifier=dict(data.get("verifier", {})),
        visible_verify_cmd=list(data.get("visible_verify_cmd", [])),
        hidden_verify_cmd=list(data.get("hidden_verify_cmd", [])),
        runtime=dict(data.get("runtime", {})),
        selfcheck=dict(data.get("selfcheck", {})),
        path=case_path,
        metadata=data,
    )


def load_all_cases() -> list[Case]:
    cases: list[Case] = []
    for family_yaml in sorted(TASKS_DIR.glob("*/family.yaml")):
        family = load_family(family_yaml.parent.name)
        for case_id in family.cases:
            cases.append(load_case(family.id, case_id))
    return cases


def select_cases(suite: str | None = None, family: str | None = None, case: str | None = None) -> list[Case]:
    if case:
        matches = [c for c in load_all_cases() if c.id == case and (not family or c.family_id == family)]
        if not matches:
            raise MetadataError(f"case not found: {case}")
        return matches
    if suite:
        selected = []
        for item in load_suite(suite).cases:
            if family and item["family_id"] != family:
                continue
            selected.append(load_case(item["family_id"], item["case_id"]))
        return selected
    if family:
        fam = load_family(family)
        return [load_case(fam.id, case_id) for case_id in fam.cases]
    return load_all_cases()


def load_adapter(path_text: str) -> Adapter:
    path = (ROOT / path_text).resolve() if not Path(path_text).is_absolute() else Path(path_text)
    data = load_json_yaml(path)
    command = data.get("command")
    if data.get("mode") != "command" or not isinstance(command, list) or not all(isinstance(x, str) for x in command):
        raise MetadataError(f"invalid command adapter schema: {path}")
    return Adapter(
        id=data["id"],
        mode=data["mode"],
        command=command,
        timeout_grace_sec=int(data.get("timeout_grace_sec", 5)),
        supports_metrics=bool(data.get("supports_metrics", False)),
        path=path,
    )
