# Scratch Blocks 新增积木方法论（含多语言）

本文总结了在本项目中新增 `control_wait_milliseconds` 积木时采用的可复用流程。目标是：**一次改动，定义可用、工具箱可见、多语言可显示、基础验证可通过**。

## 1. 先确认改动范围

新增一个积木通常不止改一个文件，至少要覆盖以下层面：

1. 积木定义：`blocks_vertical/control.js`
2. 工具箱 XML：`blocks_vertical/default_toolbox.js`
3. 消息源（英文基线）：
   - `msg/messages.js`
   - `msg/js/en.js`
   - `msg/json/en.json`
4. 运行时多语言包：`msg/scratch_msgs.js`

经验：先全局搜索已有相邻积木（例如 `control_wait`），沿着它的接入链路完整复制和改名，最稳。

## 2. 以现有同类积木为模板新增定义

在 `blocks_vertical/control.js` 中仿照 `control_wait` 新增 `control_wait_milliseconds`：

- `id` 使用新类型名：`control_wait_milliseconds`
- `message0` 使用新文案键：`Blockly.Msg.CONTROL_WAIT_MILLISECONDS`
- `args0` 延续同样参数结构：`input_value + DURATION`
- `category` 与 `extensions` 保持与同类控制积木一致

原则：结构优先保持一致，避免引入无关差异。

## 3. 在默认工具箱接入新积木

在 `blocks_vertical/default_toolbox.js` 的 control 分类加入：

- `<block type="control_wait_milliseconds" ...>`
- 为 `DURATION` 提供默认 shadow 值（毫秒语义通常用整数更直观，例如 `100`）

建议：将新积木放在语义最接近的积木旁边（本次放在 `control_wait` 后面），降低用户学习成本。

## 4. 多语言配置分层处理

### 4.1 先补英文基线（必须）

先补三个英文源，确保构建链路和开发态一致：

- `msg/messages.js`
- `msg/js/en.js`
- `msg/json/en.json`

统一新增：

- `CONTROL_WAIT_MILLISECONDS = "wait %1 milliseconds"`

### 4.2 再补运行时 locale（按产品要求）

在 `msg/scratch_msgs.js` 中补齐产品要求的语言键。本次至少支持：

- `zh-cn`
- `zh-tw`
- `en`
- `es`（映射 `es-ES`）
- `pt-br`（映射 `pt-BR`）
- `ja`（映射 `ja-JP`）
- `ko`（映射 `ko-KR`）
- `fr`（映射 `fr-FR`）
- `de`（映射 `de-DE`）

统一新增键：

- `"CONTROL_WAIT_MILLISECONDS": "<对应语言翻译>"`

注意：`scratch_msgs.js` 使用的是项目内部 locale 键名（如 `pt-br`、`zh-cn`），不一定与上层传入的 BCP-47 字符串完全一致。

## 5. 语言映射注意点（避免“有翻译但不显示”）

当上层语言是 `en-US / zh-CN / pt-BR` 这类格式时，需要确认运行时存在映射或降级逻辑：

- `en-US -> en`
- `zh-CN -> zh-cn`
- `pt-BR -> pt-br`

若映射未打通，会出现：文案键已配置但界面仍回退英文或键名本身。

## 6. 最小验证清单

每次新增积木后，至少做以下检查：

1. 代码搜索检查
   - 新 `block type`、新消息键是否在预期文件都出现
2. Lint 检查
   - 最近改动文件无新增报错
3. UI 快速验证
   - 控制分类中能看到新积木
   - 切换目标语言后文案正确显示
4. 计数验证（可选）
   - `CONTROL_WAIT_MILLISECONDS` 在目标 locale 数量符合预期

## 7. 推荐执行顺序（实操版）

1. 复制同类积木定义并改名
2. 接入 toolbox
3. 补英文三件套（`messages.js`、`js/en.js`、`json/en.json`）
4. 补 `scratch_msgs.js` 的目标 locale
5. 跑 lint + 页面快速验证

这个顺序能最大化减少“改了一半才发现漏接入”的返工。

## 8. 常见坑位

- 只改了积木定义，忘了加 toolbox，导致积木“存在但看不见”
- 只改了英文源，没改 `scratch_msgs.js`，导致非英文界面缺词
- locale 键名大小写或格式不一致（如 `pt-BR` vs `pt-br`）
- 文案键命名不统一（`CONTROL_WAIT_MILLISECOND` / `...MILLISECONDS` 混用）

---

本方法论适用于本仓库绝大多数“新增单个积木 + 多语言接入”场景；后续新增其它积木可直接复用此流程。
