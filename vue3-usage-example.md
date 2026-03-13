# Vue 3 引入 Scratch Blocks 示例

## 1. 安装与引用

若使用打包工具（Vite/Webpack），在项目中安装并引用打包后的入口：

```bash
npm install scratch-blocks
# 或使用你本地的 mod 包
```

在需要使用的组件里按需引入（具体路径以你实际打包产物为准，例如 `scratch-blocks` 的 `vertical.js` 或你构建的 bundle）：

```javascript
import Blockly from 'scratch-blocks'; // 或你的 vertical.js / 打包入口
```

若通过 `<script src="">` 引入，则直接使用全局 `Blockly`。

## 2. 单文件组件示例（Composition API + ref 容器）

```vue
<template>
  <div class="scratch-editor-container">
    <div ref="editorContainer" class="scratch-editor" id="scratch-editor"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
// 根据你的实际打包方式二选一：
// import Blockly from 'scratch-blocks';
// 或把 scratch-blocks 通过 script 标签引入，直接用全局 Blockly

const editorContainer = ref(null);
let workspace = null;

function getDefaultOptions() {
  // 若使用 toolbox，需在 template 里放一个带 id 的 toolbox 节点，或在这里用 JS 定义
  const toolbox = document.getElementById('toolbox-categories') || { contents: [] };
  return {
    comments: true,
    disable: false,
    collapse: false,
    media: '/media/',           // 或你的静态资源路径，如 require('scratch-blocks/media')
    readOnly: false,
    scrollbars: true,
    toolbox,
    toolboxPosition: 'start',
    horizontalLayout: false,
    sounds: false,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.675,
      maxScale: 4,
      minScale: 0.25,
      scaleSpeed: 1.1
    },
    colours: {
      fieldShadow: 'rgba(255, 255, 255, 0.3)',
      dragShadowOpacity: 0.6
    }
  };
}

onMounted(() => {
  if (!editorContainer.value) return;
  const options = getDefaultOptions();
  workspace = Blockly.inject(editorContainer.value, options);

  // 监听 zoom 栏的「保存」「返回」按钮事件（若你已按 mod 增加了这两个图标）
  workspace.addChangeListener((event) => {
    if (event.type === Blockly.Events.UI) {
      if (event.element === 'zoomSave') {
        console.log('用户点击了保存');
        // 例如：触发保存逻辑、emit 给父组件等
      }
      if (event.element === 'zoomReturn') {
        console.log('用户点击了返回');
        // 例如：返回上一页、关闭编辑器等
      }
    }
  });
});

onBeforeUnmount(() => {
  if (workspace) {
    workspace.dispose();
    workspace = null;
  }
});
</script>

<style scoped>
.scratch-editor-container {
  width: 100%;
  height: 100%;
}
.scratch-editor {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

## 3. 要点说明

- **容器**：`Blockly.inject` 第一个参数可以是 **DOM 元素**（如 `editorContainer.value`）或 **元素 id 字符串**（如 `'scratch-editor'`）。上面示例用 ref 拿到 DOM，避免与 Vue 的复用/key 冲突。
- **media 路径**：`media` 要指向 scratch-blocks 的 media 目录（含 `zoom-in.svg` 等），否则 zoom 等图标可能 404。若用 Vite/Webpack，可把 media 拷到 `public/media` 或通过打包配置复制，然后设 `media: '/media/'` 或实际路径。
- **toolbox**：若没有现成的 `#toolbox-categories`，可传空结构或自定义 toolbox 配置；或先不传 toolbox，再按 scratch-blocks 文档用代码配置。
- **卸载**：在 `onBeforeUnmount` 里调用 `workspace.dispose()`，避免内存泄漏和重复注入。

按上述方式即可在 Vue 3 中挂载 scratch-blocks，并接收 zoom 保存/返回的 UI 事件。
