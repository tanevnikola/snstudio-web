<script>
  let { text = '', highlightedHtml = '', highlightRange = null, readonly = true, oninput = null, onchange = () => {} } = $props();

  let editorEl;
  let textareaEl;

  $effect(() => {
    const range = highlightRange;
    if (!range || !editorEl) return;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const lineH = 1.17 * rem;
    const pad = 0.75 * rem;
    const hlTop = pad + range.start * lineH;
    requestAnimationFrame(() => {
      if (!editorEl) return;
      editorEl.scrollTo({ top: Math.max(0, hlTop - pad), behavior: 'smooth' });
    });
  });

  function handleInput(e) {
    if (readonly) return;
    oninput?.(e.target.value);
  }

  function handleBlur(e) {
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
      oninput?.(ta.value);
    }
  }
</script>

<div class="code-editor" bind:this={editorEl}>
  <div class="code-overlay">
    {#if highlightRange}
      <div
        class="line-highlight"
        style="top: calc(0.75rem + {highlightRange.start} * 1.17rem); height: calc({highlightRange.end - highlightRange.start} * 1.17rem)"
      ></div>
    {/if}
    <pre class="code-highlight" aria-hidden="true"><code>{@html highlightedHtml}&nbsp;</code></pre>
    <textarea
      class="code-input"
      class:readonly
      value={text}
      oninput={handleInput}
      onblur={handleBlur}
      onkeydown={onKeydown}
      spellcheck="false"
      autocomplete="off"
      readonly={readonly}
      bind:this={textareaEl}
    ></textarea>
  </div>
</div>

<style>
  .code-editor {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--editor-bg);
  }

  .code-overlay {
    display: grid;
    padding: 0.75rem;
    min-height: 100%;
    position: relative;
  }

  .line-highlight {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    border: 1px solid var(--primary);
    border-radius: 3px;
    background: var(--primary-subtle);
    pointer-events: none;
    z-index: 1;
  }

  .code-overlay > :not(.line-highlight) {
    grid-area: 1 / 1;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
  }

  .code-highlight {
    margin: 0;
    color: var(--editor-text);
    pointer-events: none;
  }

  .code-highlight :global(code) {
    font: inherit;
    color: inherit;
  }

  .code-input {
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: transparent;
    caret-color: var(--editor-text);
    overflow: hidden;
  }

  .code-input::selection {
    background: rgba(204, 85, 0, 0.3);
  }
</style>
