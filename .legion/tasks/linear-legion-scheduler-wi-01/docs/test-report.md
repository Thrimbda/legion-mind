# Test Report: Linear Scheduler WI-01

## Summary

**Result**: PASS

WI-01 is a docs-only implementation. The credible validation surface is therefore:

1. whitespace / diff hygiene for Markdown changes;
2. acceptance-content checks proving the delivered policy has the required sections, key scheduler terms, example count and index link;
3. explicit confirmation that the WI-01 work item acceptance checklist is complete.

Full regression (`npm run test:regression`) was not run because this change does not touch runtime code, setup scripts, package files, or test fixtures. A broad regression would add cost without proving the WI-01 document contract more directly than the targeted checks below.

## Commands run

### 1. Diff whitespace check

```bash
git diff --check
```

**Result**: PASS after fixing trailing whitespace found during the first engineer check.

Evidence:

```text
(no output)
```

### 2. WI-01 policy acceptance check

```bash
test -f "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && test -f "docs/linear-legion-scheduler/index.md" \
  && test -f "docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md" \
  && rg -q "## 2\\. Copyable Linear issue template" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 3\\. Label taxonomy" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 4\\. State mapping policy" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 5\\. Ready / skipped decision table" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 6\\. Blocker terminal-satisfied policy" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 7\\. Linear Native Agent control plane" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 8\\. Terminal terms" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 9\\. Example issues" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "## 10\\. Five-node DAG walkthrough" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "agent:ready" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "contract:stable" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "Issue\\.delegate" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "AgentSession" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "AgentActivities" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "Agent Plan" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "externalUrls" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "stop signal" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "run_terminal_success" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "run_terminal_non_success" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "blocker_satisfied" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "linearStateMapping" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && rg -q "isBlockerSatisfied\\(\\)" "docs/linear-legion-scheduler/linear-wi-contract-policy.md" \
  && test "$(rg -c '^\\| [A-Z]: ' "docs/linear-legion-scheduler/linear-wi-contract-policy.md")" -ge 5 \
  && rg -q "linear-wi-contract-policy\\.md" "docs/linear-legion-scheduler/index.md" \
  && ! rg -q --fixed-strings -- "- [ ]" "docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md" \
  && ! rg -n --pcre2 '[ \\t]+$' "docs/linear-legion-scheduler/linear-wi-contract-policy.md" "docs/linear-legion-scheduler/index.md" "docs/linear-legion-scheduler/work-items/WI-01-linear-wi-contract.md" \
  && printf 'PASS WI-01 policy acceptance checks\\n'
```

**Result**: PASS

Evidence:

```text
PASS WI-01 policy acceptance checks
```

## Acceptance coverage

| Plan acceptance | Evidence |
|---|---|
| Copyable Linear WI template | `linear-wi-contract-policy.md` §2 |
| Label taxonomy with owner/add/remove timing | `linear-wi-contract-policy.md` §3 |
| Configurable state mapping | `linear-wi-contract-policy.md` §4 |
| Ready / skipped decision table | `linear-wi-contract-policy.md` §5 |
| Blocker terminal-satisfied table | `linear-wi-contract-policy.md` §6 |
| Native agent object responsibility table | `linear-wi-contract-policy.md` §7 |
| Terminal success / non-success / blocker terms | `linear-wi-contract-policy.md` §8 |
| At least 5 example issues | `linear-wi-contract-policy.md` §9 has 7 examples |
| Index links delivery artifact | `docs/linear-legion-scheduler/index.md` links `linear-wi-contract-policy.md` |
| WI-01 checklist completed | `work-items/WI-01-linear-wi-contract.md` has no unchecked acceptance boxes |

## Failures / fixes during validation

- Initial engineer whitespace check found trailing Markdown spaces in `WI-01-linear-wi-contract.md`; fixed by using `<br>` instead of trailing spaces.
- First acceptance-check command attempt used a denied `node -e` pattern and then an `rg` pattern bug; replaced with an allowed shell / `rg` validation command.
- The same check exposed trailing Markdown spaces in the new policy header; fixed by using `<br>` line breaks.

## Skipped checks

- `npm run test:regression`: skipped because no runtime, installer, CLI, package metadata, or tests changed. Targeted Markdown contract validation is more directly tied to WI-01 acceptance.
