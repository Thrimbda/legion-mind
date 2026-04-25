# 工作流

## 1. bootstrap

目标：确认 wiki 是否具备安全维护前提，而不是先假定“完整固定 layout”。

步骤：

1. 识别 `wiki_root`
   - 优先采用宿主显式声明
   - 否则通过唯一可识别导航面可靠发现
   - 若存在多个同等候选，不猜测，进入 `blocked-by-host`
2. 识别 `index_surface`、`log_surface`、可写范围、protected scope
3. 识别或推断 baseline page families 与命名方式
4. 确认 raw roots 为只读输入层
5. 判断当前任务是 `query`、`ingest` 还是 `lint`

bootstrap 的产物是对宿主契约的运行时理解，不要求额外脚本或新系统。

## 2. ingest

目标：把 raw bundle 直接转成 durable knowledge 更新。

步骤：

1. 识别 raw bundle 与 `source_id`
2. 从 raw 中提取关键事实、限制、争议、关系与可复用知识点
3. 判断受影响页：`entity` / `topic` / `comparison` / `synthesis` / `maintenance`
4. 直接更新这些 durable pages，并用 raw ref 标注依据
5. 如出现冲突，标记 `contested`、`superseded` 或 `needs-verification`
6. 若出现新 canonical page、rename、split、merge、archive、supersede，则同步 index
7. 若宿主允许，向 log 追加安全摘要；若 log 不可写，只记录降级，不改写其他文件代偿

规则：

- 不创建 `source summary` 作为 ingest 第一落点
- 不要求 durable pages 通过来源摘要中转引用 raw
- legacy `source summary` 可读但非 canonical，默认不新建、不更新

## 3. query

目标：先回答，再判断是否形成 durable knowledge。

步骤：

1. 按 `index-first` 读取导航面与相关 durable pages
2. 若现有页不足以回答，再回 raw bundle 查证
3. 输出答案、依据与不确定性
4. 判断结果属于哪一类：
   - `ephemeral answer`
   - `durable knowledge`
   - `durable but blocked`
5. 若是 durable knowledge，尝试定位既有 canonical page 或合法新页；若 target 无法唯一判定，可优先降级为 `maintenance`
6. 应用 protected scope 与写回前提判断
7. 允许时执行写回，并按需要同步 index / log

### 3.1 durable knowledge 判定

以下条件同时成立时，才应写回：

- 对未来问题仍可复用
- 能归属到稳定页型
- 有足够 raw ref 支撑关键结论
- 不是一次性措辞、偏好表达或短期工作记忆
- 写回不会破坏命名、导航与边界契约

### 3.2 三种结果

#### A. 只回答不写回

适用：

- 仅服务当前问答
- 证据不足
- 不值得长期复用

动作：

- 给出答案
- 不修改 wiki

#### B. 正常沉淀

适用：

- 形成 durable knowledge
- target 明确
- 证据充分
- 未命中 protected scope

动作：

- 更新相关 durable page
- 需要时同步 index
- 允许时追加 log

#### C. blocked-by-host

适用：

- `wiki_root` 无法可靠发现
- target 无法安全判定
- 命中 protected scope
- 新 canonical page 需要 index 支持，但 index 不可写

动作：

- 先回答
- 明确 blocked reason
- 不做变通写回

## 4. lint

目标：发现结构债务、证据问题与维护缺口，而不是全库重写。

检查项：

1. index 是否仍能发现 canonical pages
2. 是否存在孤儿页、失效导航、生命周期断链
3. durable page 的关键结论是否有 raw ref
4. 是否把推测误写成事实
5. 冲突结论是否已标记 `contested` / `superseded`
6. `needs-verification` 是否长期未处理
7. maintenance 页是否承接了结构债务与证据缺口
8. log 是否只记录安全摘要

lint 默认输出：

- issue list
- 受影响页面
- 推荐动作

若宿主允许，可把问题写入 maintenance；不要求也不默认大规模重写正文。

## 5. 自检清单

1. 我是否把 raw 当作只读输入层？
2. 我是否遵守 `index-first`？
3. 我是否把关键结论直接锚定到 raw ref？
4. 我是否误把 schema 当成逐回合审批器？
5. 我是否在 host 未阻止时，允许 durable knowledge 正常写回？
6. 我是否在命中 protected scope 时停止而不是绕写？
7. 我是否避免新建或更新 `source summary`？
