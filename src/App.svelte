<script>
  import ComponentBlock from './lib/ComponentBlock.svelte';
  import PropertiesPanel from './lib/PropertiesPanel.svelte';
  import ComponentsPalette from './lib/ComponentsPalette.svelte';
  import { fetchSpec, createNode, getNode } from './lib/specApi.js';

  let rootNode = $state(null);
  let selectedNodeId = $state(null);
  let error = $state(null);
  let paletteWidth = $state(260);
  let propsWidth = $state(280);
  let resizingLeft = $state(false);
  let resizingRight = $state(false);

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

  // Canvas drop zone — creates root node
  let canvasHovering = $state(false);

  async function handleCanvasDrop(e) {
    e.preventDefault();
    canvasHovering = false;
    const mnemonic = e.dataTransfer.getData('text/plain');
    if (!mnemonic) return;
    error = null;
    try {
      const spec = await fetchSpec(mnemonic);
      rootNode = createNode(mnemonic, spec);
      selectedNodeId = rootNode.id;
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
    <div class="resize-handle" class:active={resizingLeft} onmousedown={startResizeLeft} role="separator" aria-label="Resize palette"></div>
    <div class="canvas">
      {#if rootNode}
        <ComponentBlock
          node={rootNode}
          selectedId={selectedNodeId}
          onselect={(id) => (selectedNodeId = id)}
        />
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
    <div class="resize-handle" class:active={resizingRight} onmousedown={startResizeRight} role="separator" aria-label="Resize properties"></div>
    <div class="properties">
      {#if selectedNodeId && getNode(selectedNodeId)}
        {#key selectedNodeId}
          <PropertiesPanel nodeId={selectedNodeId} />
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

  .resize-handle {
    width: 5px;
    cursor: col-resize;
    background: #ddd;
    transition: background 0.15s;
  }

  .resize-handle:hover,
  .resize-handle.active {
    background: #999;
  }

  .canvas {
    padding: 1.5rem;
    overflow-y: auto;
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
</style>
