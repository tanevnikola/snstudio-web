<script>
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';

  hljs.registerLanguage('yaml', yamlLang);

  let { yamlText = '', highlightText = '', readonly = true, onchange = () => {} } = $props();

  let editorEl;
  let highlightEl;
  let textareaEl;

  let highlighted = $derived(
    yamlText ? hljs.highlight(yamlText, { language: 'yaml' }).value : ''
  );

  /** Find the line range [startLine, endLine) of highlightText within yamlText. */
  let highlightRange = $derived.by(() => {
    if (!highlightText || !yamlText) return null;
    const hLines = highlightText.replace(/\n$/, '').split('\n');
    const yLines = yamlText.split('\n');
    if (hLines.length === 0) return null;

    const firstKey = hLines[0].trim();
    for (let i = 0; i < yLines.length; i++) {
      const trimmed = yLines[i].trim();
      if (trimmed !== firstKey) continue;

      // Determine indentation offset
      const indent = yLines[i].length - yLines[i].trimStart().length;
      let match = true;
      for (let j = 1; j < hLines.length; j++) {
        if (i + j >= yLines.length) { match = false; break; }
        const expected = ' '.repeat(indent) + hLines[j];
        if (yLines[i + j] !== expected) { match = false; break; }
      }
      if (match) return { start: i, end: i + hLines.length };
    }
    return null;
  });

  $effect(() => {
    if (highlightEl && editorEl) {
      // Access highlightRange to subscribe to changes
      highlightRange;
      // Tick: wait for DOM to update position
      requestAnimationFrame(() => {
        if (!highlightEl || !editorEl) return;
        const containerRect = editorEl.getBoundingClientRect();
        const hlRect = highlightEl.getBoundingClientRect();
        // If highlight is not fully visible, scroll it into view
        if (hlRect.top < containerRect.top || hlRect.bottom > containerRect.bottom) {
          highlightEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
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
        bind:this={highlightEl}
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
