<script>
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';

  hljs.registerLanguage('yaml', yamlLang);

  let { yamlText = '', highlightRange = null, readonly = true, onchange = () => {} } = $props();

  let editorEl;
  let textareaEl;

  let highlighted = $derived(
    yamlText ? hljs.highlight(yamlText, { language: 'yaml' }).value : ''
  );

  $effect(() => {
    const range = highlightRange;
    if (!range || !editorEl) return;
    // Compute highlight top from range (line height = 0.78rem * 1.5 = 1.17rem)
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const lineH = 1.17 * rem;
    const pad = 0.75 * rem;
    const hlTop = pad + range.start * lineH;
    // Always scroll so the highlight top aligns with the top of the view
    requestAnimationFrame(() => {
      if (!editorEl) return;
      editorEl.scrollTo({ top: Math.max(0, hlTop - pad), behavior: 'smooth' });
    });
  });

  function onInput(e) {
    if (readonly) return;
    onchange(e.target.value);
  }

  function onKeydown(e) {
    if (readonly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      onchange(ta.value);
    }
  }
</script>

<div class="yaml-editor" bind:this={editorEl}>
  <div class="yaml-overlay">
    {#if highlightRange}
      <div
        class="line-highlight"
        style="top: calc(0.75rem + {highlightRange.start} * 1.17rem); height: calc({highlightRange.end - highlightRange.start} * 1.17rem)"
      ></div>
    {/if}
    <pre class="yaml-highlight" aria-hidden="true"><code>{@html highlighted}&nbsp;</code></pre>
    <textarea
      class="yaml-input"
      class:readonly
      value={yamlText}
      oninput={onInput}
      onkeydown={onKeydown}
      spellcheck="false"
      autocomplete="off"
      readonly={readonly}
      bind:this={textareaEl}
    ></textarea>
  </div>
</div>

<style>
  .yaml-editor {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: #1e1e2e;
  }

  .yaml-overlay {
    display: grid;
    padding: 0.75rem;
    min-height: 100%;
    position: relative;
  }

  .line-highlight {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    border: 1px solid rgba(137, 180, 250, 0.35);
    border-radius: 3px;
    background: rgba(137, 180, 250, 0.07);
    pointer-events: none;
    z-index: 1;
  }

  .yaml-overlay > :not(.line-highlight) {
    grid-area: 1 / 1;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
  }

  .yaml-highlight {
    margin: 0;
    color: #cdd6f4;
    pointer-events: none;
  }

  .yaml-highlight :global(code) {
    font: inherit;
    color: inherit;
  }

  .yaml-input {
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: transparent;
    caret-color: #cdd6f4;
    overflow: hidden;
  }

  .yaml-input::selection {
    background: rgba(137, 180, 250, 0.3);
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
