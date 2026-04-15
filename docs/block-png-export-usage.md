# 积木 PNG 导出使用说明

本文档对应脚本：`build/export-vertical-blocks-to-png.js`

## 1) 前置条件

- 已安装依赖：`npm install`
- Mac 上可用 Chrome 路径：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- 如果缺少编译产物（如首次拉代码），先执行：

```bash
PATH="$PWD/node_modules/.bin:$PATH" python3 build.py
```

## 2) 基本用法

### 导出全部积木（默认语言目录 `en-US`）

```bash
npm run export:blocks:png
```

输出目录示例：

```text
blocky-pngs/en-US/blocks-png/control
blocky-pngs/en-US/blocks-png/motion
...
```

### 只导出某个分类

```bash
npm run export:blocks:png -- --category=control
```

### 指定语言目录

```bash
npm run export:blocks:png -- --locale=zh-cn
```

输出目录会变为：

```text
blocky-pngs/zh-cn/blocks-png/...
```

### 分类 + 语言一起指定

```bash
npm run export:blocks:png -- --category=control --locale=ja
```

## 3) 参数说明

- `--category=<分类ID>`
  - 例：`control`、`motion`、`looks`、`sound`、`events`、`sensing`、`operators`、`data`、`more`、`extensions`
- `--locale=<语言代码>`
  - 影响两件事：
    - Blockly 文案语言（用于渲染积木文字）
    - 导出目录语言层级（`blocky-pngs/<locale>/blocks-png/...`）

> 兼容说明：`--locale=en-US` 会自动映射到 Blockly 的 `en`，但目录名仍使用 `en-US`。

## 4) 当前可用语言（已在 playground 中定义）

以下语言代码可直接用于 `--locale`：

- `en`
- `ca`
- `cs`
- `da`
- `nl`
- `fi`
- `fr`
- `de`
- `el`
- `he`
- `hu`
- `id`
- `ga`
- `it`
- `ja`
- `ja-Hira`
- `mi`
- `nb`
- `pt`
- `pt-br`
- `gd`
- `sr`
- `sl`
- `es`
- `es-419`
- `sv`
- `tr`
- `uk`
- `vi`
- `cy`
- `zh-cn`
- `zh-tw`

另外也支持目录友好写法：

- `en-US`（会映射到 Blockly `en`，目录保留 `en-US`）

## 5) 导出结果特性

- PNG 背景为透明（alpha 通道）
- 积木内图标资源会先校验加载，减少 icon 丢失
- 文件命名规则：`<block_id>.png`

## 6) 常见问题

### 执行时报找不到 `google-closure-compiler`

先执行：

```bash
PATH="$PWD/node_modules/.bin:$PATH" python3 build.py
```

### 某些语言没有翻译

脚本会按 `--locale` 渲染；若该语言缺失文案，会出现英文或回退文案。这属于语言包内容问题，不影响导出功能。
