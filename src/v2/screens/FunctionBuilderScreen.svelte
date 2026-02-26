<script>
  import ComponentsPalette from '../components/palette/ComponentsPalette.svelte';
  import FunctionComposer from '../components/composer/FunctionComposer.svelte';
  import TaskProperties from '../components/composer/TaskProperties.svelte';
  import YamlEditor from '../components/editor/YamlEditor.svelte';
  import { getSelectedTaskRef } from '../components/composer/selectionState.svelte.js';
  import { getParsedTree } from '../components/composer/dragState.js';
  import jsYaml from 'js-yaml';

  let { yaml = '' } = $props();

  let composerYaml = $state(yaml);

  let paletteWidth = $state(260);
  let propsWidth = $state(Math.floor(window.innerWidth / 4));
  let resizingLeft = $state(false);
  let resizingRight = $state(false);
  let resizingYaml = $state(false);
  let yamlHeight = $state(null);

  const MARKER = '__hl__';

  let highlightRange = $derived.by(() => {
    const ref = getSelectedTaskRef();
    const tree = getParsedTree();
    if (!ref || !tree) return null;

    // Inject temporary marker into task ref, dump, find it
    ref[MARKER] = 1;
    const dump = jsYaml.dump(tree, { lineWidth: -1, noRefs: true });
    delete ref[MARKER];

    const lines = dump.split('\n');
    const mi = lines.findIndex(l => l.trim() === MARKER + ': 1');
    if (mi < 0) return null;

    // Scan backward from marker to find object start
    const markerIndent = lines[mi].search(/\S/);
    let start = mi;
    while (start > 0) {
      const prev = lines[start - 1];
      if (prev.trim() === '') { start--; continue; }
      const prevIndent = prev.search(/\S/);
      if (prevIndent < markerIndent) {
        if (prevIndent === markerIndent - 2 && prev.trimStart().startsWith('- ')) start--;
        break;
      }
      start--;
    }

    return { start, end: mi };
  });

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
</script>

<div class="function-builder">
  <div class="workspace" style="grid-template-columns: {paletteWidth}px auto 1fr auto {propsWidth}px">
    <div class="palette">
      <ComponentsPalette />
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="resize-handle vertical" class:active={resizingLeft} onmousedown={startResizeLeft} role="separator" aria-label="Resize palette"></div>
    <div class="center-column">
      <div class="composer">
        <FunctionComposer yaml={composerYaml} onyamlchange={(text) => { composerYaml = text; }} />
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="resize-handle horizontal" class:active={resizingYaml} onmousedown={startResizeYaml} role="separator" aria-label="Resize YAML panel"></div>
      <YamlEditor yamlText={composerYaml} {highlightRange} style={yamlHeight ? `flex: 0 0 ${yamlHeight}px` : ''} onchange={(text) => { composerYaml = text; }} />
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="resize-handle vertical" class:active={resizingRight} onmousedown={startResizeRight} role="separator" aria-label="Resize properties"></div>
    <div class="properties">
      <TaskProperties />
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

  .composer {
    flex: 2;
    overflow-y: auto;
    min-height: 0;
  }

  .properties {
    background: white;
    overflow-y: auto;
    min-width: 0;
  }
</style>
