"""Command line entrypoint for VibeHarnessBench MVP."""

from __future__ import annotations

import argparse
import sys

from bench.runner.compare import compare_runs
from bench.runner.doctor import run_doctor
from bench.runner.engine import run_benchmark
from bench.runner.selfcheck import run_selfcheck


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m bench.cli")
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser("doctor", help="check local benchmark metadata and isolation rules")
    doctor.set_defaults(func=lambda args: run_doctor())

    run = sub.add_parser("run", help="run a benchmark suite/family/case")
    run.add_argument("--suite", default="smoke-v1")
    run.add_argument("--family")
    run.add_argument("--case")
    run.add_argument("--adapter", default="bench/adapters/examples/noop.yaml")
    run.add_argument("--seed", type=int)
    run.set_defaults(func=run_benchmark)

    selfcheck = sub.add_parser("selfcheck", help="run protected oracle/negative selfcheck")
    selfcheck.add_argument("--suite")
    selfcheck.add_argument("--family")
    selfcheck.add_argument("--case")
    selfcheck.set_defaults(func=run_selfcheck)

    compare = sub.add_parser("compare", help="compare two run directories")
    compare.add_argument("left")
    compare.add_argument("right")
    compare.set_defaults(func=compare_runs)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = args.func(args)
    except TypeError:
        result = args.func()
    if isinstance(result, int):
        return result
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
