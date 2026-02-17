<script>
  import ComponentBlock from './lib/ComponentBlock.svelte';
  import PropertiesPanel from './lib/PropertiesPanel.svelte';
  import ComponentsPalette from './lib/ComponentsPalette.svelte';
  import { fetchSpec, createNode, getNode, addChild } from './lib/specApi.js';
  import { nodeToYaml } from './lib/yamlSerializer.js';
  import { yamlToNodeTree } from './lib/yamlDeserializer.js';
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';

  hljs.registerLanguage('yaml', yamlLang);

  let rootNodeId = $state(null);
  let selectedNodeId = $state(null);
  let error = $state(null);
  let paletteWidth = $state(260);
  let propsWidth = $state(280);
  let yamlHeight = $state(220);
  let resizingLeft = $state(false);
  let resizingRight = $state(false);
  let resizingYaml = $state(false);
  let copyLabel = $state('Copy');

  // YAML editor state
  let yamlText = $state('');
  let yamlEditing = $state(false); // true while user is typing in the editor
  let yamlError = $state(null);
  let debounceTimer = null;
  let treeTick = $state(0); // bumped by tree changes (canvas/properties)
  let skipNextSerialize = false; // skip re-serialize after YAML→tree parse

  // Highlighted HTML from current yamlText
  let yamlHtml = $derived(
    yamlText ? hljs.highlight(yamlText, { language: 'yaml' }).value : ''
  );

  // When tree changes (not from YAML editing), regenerate yamlText
  $effect(() => {
    void treeTick;
    if (yamlEditing) return;
    if (skipNextSerialize) {
      skipNextSerialize = false;
      return;
    }
    if (!rootNodeId) {
      yamlText = '';
      return;
    }
    try {
      yamlText = nodeToYaml(rootNodeId);
    } catch {
      yamlText = '# Error generating YAML';
    }
  });

  function bumpTree() {
    treeTick++;
  }

  function onYamlInput(e) {
    yamlText = e.target.value;
    yamlEditing = true;
    yamlError = null;

    // Sync scroll
    const textarea = e.target;
    const highlight = textarea.parentElement.querySelector('.yaml-highlight');
    if (highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }

    // Debounce parse
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const newRootId = await yamlToNodeTree(yamlText);
        skipNextSerialize = true;
        rootNodeId = newRootId;
        selectedNodeId = null;
        yamlError = null;
      } catch (err) {
        yamlError = err.message;
      } finally {
        yamlEditing = false;
      }
    }, 600);
  }

  function onYamlScroll(e) {
    const highlight = e.target.parentElement.querySelector('.yaml-highlight');
    if (highlight) {
      highlight.scrollTop = e.target.scrollTop;
      highlight.scrollLeft = e.target.scrollLeft;
    }
  }

  function startResizeLeft(e) {
    e.preventDefault();
    resizingLeft = true;
    const startX = e.clientX;
    const startWidth = paletteWidth;

    function onMove(ev) {
      paletteWidth = Math.max(140, Math.min(500, startWidth + ev.clientX - startX));
    }
    function onUp() {
      resizingLeft = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function startResizeRight(e) {
    e.preventDefault();
    resizingRight = true;
    const startX = e.clientX;
    const startWidth = propsWidth;

    function onMove(ev) {
      propsWidth = Math.max(180, Math.min(500, startWidth - (ev.clientX - startX)));
    }
    function onUp() {
      resizingRight = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function startResizeYaml(e) {
    e.preventDefault();
    resizingYaml = true;
    const startY = e.clientY;
    const startHeight = yamlHeight;

    function onMove(ev) {
      yamlHeight = Math.max(80, Math.min(600, startHeight - (ev.clientY - startY)));
    }
    function onUp() {
      resizingYaml = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function copyYaml() {
    navigator.clipboard.writeText(yamlText).then(() => {
      copyLabel = 'Copied!';
      setTimeout(() => (copyLabel = 'Copy'), 1500);
    });
  }

  // Canvas drop zone — creates root node
  let canvasHovering = $state(false);

  async function handleCanvasDrop(e) {
    e.preventDefault();
    canvasHovering = false;
    const mnemonic = e.dataTransfer.getData('text/plain');
    if (!mnemonic) return;
    error = null;
    try {
      if (mnemonic === 'DomainFunction') {
        // DomainFunction dropped directly — use as root
        const spec = await fetchSpec(mnemonic);
        const node = createNode(mnemonic, spec);
        rootNodeId = node.id;
        selectedNodeId = node.id;
      } else {
        // Task dropped — auto-wrap in a DomainFunction root
        const dfSpec = await fetchSpec('DomainFunction');
        const dfNode = createNode('DomainFunction', dfSpec);
        const taskSpec = await fetchSpec(mnemonic);
        const taskNode = createNode(mnemonic, taskSpec);
        addChild(dfNode.id, 'task', taskNode);
        rootNodeId = dfNode.id;
        selectedNodeId = taskNode.id;
      }
      bumpTree();
    } catch (err) {
      error = err.message;
    }
  }
</script>

<div class="app">
  <header>
    <h1>SNStudio</h1>
    {#if error}
      <div class="error">{error}</div>
    {/if}
  </header>

  <div class="workspace" style="grid-template-columns: {paletteWidth}px auto 1fr auto {propsWidth}px">
    <div class="palette">
      <ComponentsPalette />
    </div>
    <div class="resize-handle vertical" class:active={resizingLeft} onmousedown={startResizeLeft} role="separator" aria-label="Resize palette"></div>
    <div class="center-column">
      <div class="canvas">
        {#if rootNodeId}
          {#key rootNodeId}
            <ComponentBlock
              nodeId={rootNodeId}
              selectedId={selectedNodeId}
              onselect={(id) => (selectedNodeId = id)}
              onchange={bumpTree}
            />
          {/key}
        {:else}
          <div
            class="canvas-dropzone"
            class:hovering={canvasHovering}
            ondragover={(e) => { e.preventDefault(); canvasHovering = true; }}
            ondragleave={() => (canvasHovering = false)}
            ondrop={handleCanvasDrop}
            role="region"
            aria-label="Canvas drop zone"
          >
            Drop a component here to start
          </div>
        {/if}
      </div>
      <div class="resize-handle horizontal" class:active={resizingYaml} onmousedown={startResizeYaml} role="separator" aria-label="Resize YAML panel"></div>
      <div class="yaml-panel" style="height: {yamlHeight}px">
        <div class="yaml-header">
          <span class="yaml-title">YAML</span>
          {#if yamlError}
            <span class="yaml-error">{yamlError}</span>
          {/if}
          <button class="copy-btn" onclick={copyYaml}>{copyLabel}</button>
        </div>
        <div class="yaml-editor">
          <pre class="yaml-highlight" aria-hidden="true"><code>{@html yamlHtml}&nbsp;</code></pre>
          <textarea
            class="yaml-textarea"
            value={yamlText}
            oninput={onYamlInput}
            onscroll={onYamlScroll}
            spellcheck="false"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          ></textarea>
        </div>
      </div>
    </div>
    <div class="resize-handle vertical" class:active={resizingRight} onmousedown={startResizeRight} role="separator" aria-label="Resize properties"></div>
    <div class="properties">
      {#if selectedNodeId && getNode(selectedNodeId)}
        {#key selectedNodeId}
          <PropertiesPanel nodeId={selectedNodeId} onchange={bumpTree} />
        {/key}
      {:else}
        <div class="no-selection">Select a block to see its properties</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
  }

  header {
    padding: 0.5rem 1.5rem;
    border-bottom: 1px solid #ddd;
    background: white;
  }

  h1 {
    margin: 0;
    font-size: 1.1rem;
  }

  .error {
    color: #d32f2f;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .workspace {
    display: grid;
    flex: 1;
    overflow: hidden;
  }

  .palette {
    background: white;
    overflow-y: auto;
    min-width: 0;
  }

  .resize-handle.vertical {
    width: 5px;
    cursor: col-resize;
    background: #ddd;
    transition: background 0.15s;
  }

  .resize-handle.horizontal {
    height: 5px;
    cursor: row-resize;
    background: #ddd;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .resize-handle:hover,
  .resize-handle.active {
    background: #999;
  }

  .center-column {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  .canvas {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    min-height: 0;
  }

  .properties {
    background: white;
    overflow-y: auto;
    min-width: 0;
  }

  .canvas-dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    border: 2px dashed #ccc;
    border-radius: 8px;
    color: #999;
    font-size: 0.9rem;
    transition: border-color 0.15s, background 0.15s;
  }

  .canvas-dropzone.hovering {
    border-color: #666;
    background: #eef;
  }

  .no-selection {
    padding: 1rem;
    color: #999;
    font-size: 0.85rem;
  }

  .yaml-panel {
    display: flex;
    flex-direction: column;
    background: #1e1e2e;
    flex-shrink: 0;
    min-height: 0;
  }

  .yaml-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: #181825;
    flex-shrink: 0;
  }

  .yaml-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: #6c7086;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .yaml-error {
    font-size: 0.65rem;
    color: #f38ba8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .copy-btn {
    margin-left: auto;
    background: none;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
    font-family: inherit;
    color: #6c7086;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }

  .copy-btn:hover {
    color: #cdd6f4;
    border-color: #6c7086;
  }

  /* Editor: textarea overlaid on highlighted pre */
  .yaml-editor {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .yaml-highlight,
  .yaml-textarea {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 0.75rem;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
    overflow: auto;
    border: none;
    outline: none;
  }

  .yaml-highlight {
    color: #cdd6f4;
    pointer-events: none;
    z-index: 1;
  }

  .yaml-highlight :global(code) {
    font: inherit;
    color: inherit;
  }

  .yaml-textarea {
    color: transparent;
    caret-color: #cdd6f4;
    background: transparent;
    resize: none;
    z-index: 2;
    -webkit-text-fill-color: transparent;
  }

  .yaml-textarea::selection {
    background: rgba(137, 180, 250, 0.25);
    -webkit-text-fill-color: transparent;
  }

  /* Catppuccin Mocha syntax colors */
  .yaml-highlight :global(.hljs-attr) {
    color: #89b4fa;
  }

  .yaml-highlight :global(.hljs-string) {
    color: #a6e3a1;
  }

  .yaml-highlight :global(.hljs-number) {
    color: #fab387;
  }

  .yaml-highlight :global(.hljs-literal) {
    color: #fab387;
  }

  .yaml-highlight :global(.hljs-bullet) {
    color: #94e2d5;
  }

  .yaml-highlight :global(.hljs-comment) {
    color: #6c7086;
    font-style: italic;
  }

  .yaml-highlight :global(.hljs-meta) {
    color: #f5c2e7;
  }

  .yaml-highlight :global(.hljs-section) {
    color: #89b4fa;
    font-weight: 600;
  }
</style>
