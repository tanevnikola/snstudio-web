<script>
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';

  hljs.registerLanguage('yaml', yamlLang);

  let { yamlText = '', onchange = () => {} } = $props();

  let editText = $state(yamlText);
  let textareaEl;

  $effect(() => {
    editText = yamlText;
  });

  let highlighted = $derived(
    editText ? hljs.highlight(editText, { language: 'yaml' }).value : ''
  );

  function onInput(e) {
    editText = e.target.value;
    onchange(editText);
  }

  function onKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      editText = ta.value;
      onchange(editText);
    }
  }
</script>

<div class="yaml-editor">
  <pre class="yaml-highlight" aria-hidden="true"><code>{@html highlighted}&nbsp;</code></pre>
  <textarea
    class="yaml-input"
    value={editText}
    oninput={onInput}
    onkeydown={onKeydown}
    spellcheck="false"
    autocomplete="off"
    bind:this={textareaEl}
  ></textarea>
</div>

<style>
  .yaml-editor {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: #1e1e2e;
    padding: 0.75rem;
    position: relative;
  }

  .yaml-highlight {
    margin: 0;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
    color: #cdd6f4;
    pointer-events: none;
  }

  .yaml-highlight :global(code) {
    font: inherit;
    color: inherit;
  }

  .yaml-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0.75rem;
    margin: 0;
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    color: transparent;
    caret-color: #cdd6f4;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
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
