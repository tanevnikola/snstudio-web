<script>
  import ComponentBlock from './ComponentBlock.svelte';
  import PropertiesPanel from './PropertiesPanel.svelte';
  import ComponentsPalette from './ComponentsPalette.svelte';
  import { fetchSpec, createNode, getNode, addChild, clearAllNodes } from '../../lib/specApi.js';
  import { nodeToYaml } from '../../lib/yamlSerializer.js';
  import { yamlToNodeTree } from '../../lib/yamlDeserializer.js';
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';
  import { settings } from '../../lib/settings.svelte.js';

  hljs.registerLanguage('yaml', yamlLang);

  let rootNodeId = $state(null);
  let selectedNodeId = $state(null);
  let error = $state(null);
  let paletteWidth = $state(260);
  let propsWidth = $state(Math.floor(window.innerWidth / 4));
  let resizingLeft = $state(false);
  let resizingRight = $state(false);
  let resizingYaml = $state(false);
  let yamlCollapsed = $state(false);
  let yamlHeight = $state(null); // null = use default 1/3 flex, number = user-resized px
  let copyLabel = $state('Copy');

  // YAML editor state
  let yamlText = $state('');
  let yamlLineMap = $state(new Map()); // nodeId → line number
  let yamlEditing = $state(false); // true while user is typing in the editor
  let yamlError = $state(null);
  let debounceTimer = null;
  let treeTick = $state(0); // bumped by tree changes (canvas/properties)
  let skipNextSerialize = false; // skip re-serialize after YAML→tree parse

  // Undo/redo history
  let yamlHistory = $state([]);
  let historyIndex = $state(-1);
  let isUndoRedo = false; // prevent history push during undo/redo apply

  function pushHistory(text) {
    if (isUndoRedo) return;
    if (historyIndex >= 0 && yamlHistory[historyIndex] === text) return;
    // Truncate any forward history
    yamlHistory = yamlHistory.slice(0, historyIndex + 1);
    yamlHistory.push(text);
    const limit = settings.codeEditor.maxCodeHistory;
    if (yamlHistory.length > limit) {
      yamlHistory = yamlHistory.slice(yamlHistory.length - limit);
    }
    historyIndex = yamlHistory.length - 1;
  }

  async function applyHistoryEntry(text) {
    isUndoRedo = true;
    yamlText = text;
    yamlEditing = false;
    yamlError = null;
    try {
      const newRootId = await yamlToNodeTree(text);
      skipNextSerialize = true;
      rootNodeId = newRootId;
      selectedNodeId = null;
    } catch (err) {
      yamlError = err.message;
    } finally {
      isUndoRedo = false;
    }
  }

  async function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    await applyHistoryEntry(yamlHistory[historyIndex]);
  }

  async function redo() {
    if (historyIndex >= yamlHistory.length - 1) return;
    historyIndex++;
    await applyHistoryEntry(yamlHistory[historyIndex]);
  }

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
      // Still rebuild lineMap from the current text so click-to-scroll works
      if (rootNodeId) {
        try {
          const result = nodeToYaml(rootNodeId);
          yamlLineMap = result.lineMap;
        } catch { /* ignore */ }
      }
      return;
    }
    if (!rootNodeId) {
      yamlText = '';
      yamlLineMap = new Map();
      return;
    }
    try {
      const result = nodeToYaml(rootNodeId);
      yamlText = result.text;
      yamlLineMap = result.lineMap;
      pushHistory(result.text);
    } catch {
      yamlText = '# Error generating YAML';
      yamlLineMap = new Map();
    }
  });

  // Scroll YAML editor to the selected node's line
  $effect(() => {
    if (!selectedNodeId || yamlCollapsed || yamlEditing) return;
    const line = yamlLineMap.get(selectedNodeId);
    if (line == null) return;
    // Find the textarea and scroll to the line
    const textarea = document.querySelector('.yaml-textarea');
    if (!textarea) return;
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 18;
    const scrollTarget = line * lineHeight;
    const viewHeight = textarea.clientHeight;
    // Center the target line in the viewport
    textarea.scrollTop = Math.max(0, scrollTarget - viewHeight / 3);
    // Also sync the highlight overlay
    const highlight = textarea.parentElement?.querySelector('.yaml-highlight');
    if (highlight) highlight.scrollTop = textarea.scrollTop;
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
        pushHistory(yamlText);
      } catch (err) {
        yamlError = err.message;
      } finally {
        yamlEditing = false;
      }
    }, 600);
  }

  function onYamlKeydown(e) {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    if (e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo(); else undo();
    } else if (e.key === 'y') {
      e.preventDefault();
      redo();
    }
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
      propsWidth = Math.max(180, Math.min(Math.floor(window.innerWidth / 2), startWidth - (ev.clientX - startX)));
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
    // If first resize, measure current rendered height as starting point
    const panel = e.target.nextElementSibling;
    const startHeight = yamlHeight ?? panel?.offsetHeight ?? 250;
    const startY = e.clientY;

    function onMove(ev) {
      yamlHeight = Math.max(80, Math.min(800, startHeight - (ev.clientY - startY)));
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

  // Create a fresh DomainFunction chain as root
  async function initRoot() {
    clearAllNodes();
    const spec = await fetchSpec('DomainFunction');
    const node = createNode('DomainFunction', spec);
    // Initialize tasks array so it renders as Task.Chain
    node.children['tasks'] = [];
    rootNodeId = node.id;
    selectedNodeId = node.id;
    bumpTree();
  }

  function handleRemoveRoot() {
    initRoot();
  }

  // Auto-init on mount
  initRoot();
</script>

<div class="function-builder">
  {#if error}
    <div class="error">{error}</div>
  {/if}

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
              onremove={handleRemoveRoot}
              {treeTick}
            />
          {/key}
        {/if}
      </div>
      {#if !yamlCollapsed}
        <div class="resize-handle horizontal" class:active={resizingYaml} onmousedown={startResizeYaml} role="separator" aria-label="Resize YAML panel"></div>
      {/if}
      <div
        class="yaml-panel"
        class:collapsed={yamlCollapsed}
        style={!yamlCollapsed && yamlHeight ? `flex: 0 0 ${yamlHeight}px` : ''}
      >
        <div class="yaml-header">
          <button type="button" class="yaml-collapse-btn" onclick={() => (yamlCollapsed = !yamlCollapsed)}>
            <span class="yaml-collapse-arrow">{yamlCollapsed ? '▶' : '▼'}</span>
            <span class="yaml-title">YAML</span>
          </button>
          {#if yamlError}
            <span class="yaml-error">{yamlError}</span>
          {/if}
          <span class="yaml-actions">
            <button type="button" class="yaml-action-btn" title="Undo (Ctrl+Z)" disabled={historyIndex <= 0} onclick={undo}>↩</button>
            <button type="button" class="yaml-action-btn" title="Redo (Ctrl+Shift+Z)" disabled={historyIndex >= yamlHistory.length - 1} onclick={redo}>↪</button>
            <button type="button" class="copy-btn" onclick={copyYaml}>{copyLabel}</button>
          </span>
        </div>
        {#if !yamlCollapsed}
          <div class="yaml-editor">
            <pre class="yaml-highlight" aria-hidden="true"><code>{@html yamlHtml}&nbsp;</code></pre>
            <textarea
              class="yaml-textarea"
              value={yamlText}
              oninput={onYamlInput}
              onscroll={onYamlScroll}
              onkeydown={onYamlKeydown}
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
            ></textarea>
          </div>
        {/if}
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
  .function-builder {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .error {
    color: #d32f2f;
    font-size: 0.85rem;
    padding: 0.25rem 1.5rem;
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
    flex: 2;
    padding: 1.5rem;
    overflow-y: auto;
    min-height: 0;
  }

  .properties {
    background: white;
    overflow-y: auto;
    min-width: 0;
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
    flex: 1;
    min-height: 0;
  }

  .yaml-panel.collapsed {
    flex: 0 0 auto;
  }

  .yaml-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: #181825;
    flex-shrink: 0;
  }

  .yaml-collapse-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .yaml-collapse-btn:hover .yaml-title,
  .yaml-collapse-btn:hover .yaml-collapse-arrow {
    color: #cdd6f4;
  }

  .yaml-collapse-arrow {
    font-size: 0.55rem;
    color: #6c7086;
    width: 0.65rem;
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

  .yaml-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .yaml-action-btn {
    background: none;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 0.15rem 0.4rem;
    font-size: 0.75rem;
    color: #6c7086;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    line-height: 1;
  }

  .yaml-action-btn:hover:not(:disabled) {
    color: #cdd6f4;
    border-color: #6c7086;
  }

  .yaml-action-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .copy-btn {
    background: none;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
    color: #6c7086;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    font-family: inherit;
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
