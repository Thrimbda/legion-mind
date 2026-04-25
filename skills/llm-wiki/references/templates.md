# Templates

创建新页面时优先套用这些模板。可以删减不适用 section，但不要删除证据与不确定性表达。

说明：以下 `Status` 行按需使用；若页面当前没有明显的不确定性、冲突或生命周期状态，可以省略，或由宿主使用自己的中性状态写法。

## 1. `index.md`

```md
# Index

## About

<one sentence about this wiki>

## Active entry points

- [<page>](path) — <why this matters>

## Entities

- [<entity>](entities/<slug>.md) — <one sentence>

## Topics

- [<topic>](topics/<slug>.md) — <one sentence>

## Comparisons

- [<comparison>](comparisons/<slug>.md) — <one sentence>

## Synthesis

- [<synthesis>](synthesis/<slug>.md) — <one sentence>

## Maintenance

- [<maintenance>](maintenance/<slug>.md) — <one sentence>
```

## 2. `log.md`

```md
# Log

## [YYYY-MM-DD] <action> | <scope>

- Action:
- Touched pages:
- Source ids / page ids:
- Summary:
- Blocked or degraded:
```

## 3. entity page：`entities/<slug>.md`

```md
# <Entity name>

- Status: needs-verification | contested | superseded | archived | merged
- Last updated: YYYY-MM-DD

## Identity

<what this entity is>

## Key Facts

| claim | status | evidence |
| ----- | ------ | -------- |
| <claim> | <status> | `<source_id + locator>` |

## Relations

- [<related page>](../topics/<slug>.md) — <relationship>

## Gaps / Open Questions

- <question>

## Raw refs

- `<source_id + locator>`
```

## 4. topic page：`topics/<slug>.md`

```md
# <Topic>

- Status: needs-verification | contested | superseded | archived | merged
- Last updated: YYYY-MM-DD

## Scope

<what this page covers>

## Core Ideas

| idea | status | evidence |
| ---- | ------ | -------- |
| <idea> | <status> | `<source_id + locator>` |

## Related Pages

- [<page>](../comparisons/<slug>.md) — <relationship>

## Exceptions / Gaps

- <gap>

## Raw refs

- `<source_id + locator>`
```

## 5. comparison page：`comparisons/<slug>.md`

```md
# <Comparison question>

- Status: needs-verification | contested | superseded | archived | merged
- Last updated: YYYY-MM-DD

## Question

<comparison question>

## Dimensions

| dimension | option A | option B | evidence |
| --------- | -------- | -------- | -------- |
| <dimension> | <summary> | <summary> | `<source_id + locator>` |

## Summary

<short synthesis>

## Trade-offs / Conflicts

- <trade-off>

## Raw refs

- `<source_id + locator>`
```

## 6. synthesis page：`synthesis/<slug>.md`

```md
# <Synthesis title>

- Status: needs-verification | contested | superseded | archived | merged
- Last updated: YYYY-MM-DD

## Goal

<why this synthesis exists>

## Main Conclusions

| conclusion | status | evidence |
| ---------- | ------ | -------- |
| <conclusion> | <status> | `<source_id + locator>` |

## Supporting Pages

- [<topic>](../topics/<slug>.md) — <what it contributes>
- [<comparison>](../comparisons/<slug>.md) — <what it contributes>
- [<entity>](../entities/<slug>.md) — <what it contributes>

## Competing Interpretations

- <interpretation>

## Open Questions

- <question>

## Raw refs

- `<source_id + locator>`
```

## 7. maintenance page：`maintenance/<slug>.md`

```md
# <Maintenance title>

## Issues

| issue | severity | affected pages | next action |
| ----- | -------- | -------------- | ----------- |
| <issue> | low / medium / high | <pages> | <action> |

## Evidence / Context

- `<source_id + locator>`

## Notes

- <note>
```
