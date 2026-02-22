<script>
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';

  hljs.registerLanguage('yaml', yamlLang);

  let { yamlText = '' } = $props();

  let highlighted = $derived(
    yamlText ? hljs.highlight(yamlText, { language: 'yaml' }).value : ''
  );
</script>

<div class="yaml-editor">
  <pre class="yaml-highlight" aria-hidden="true"><code>{@html highlighted}&nbsp;</code></pre>
</div>

<style>
  .yaml-editor {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: #1e1e2e;
    padding: 0.75rem;
  }

  .yaml-highlight {
    margin: 0;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    tab-size: 2;
    white-space: pre;
    color: #cdd6f4;
  }

  .yaml-highlight :global(code) {
    font: inherit;
    color: inherit;
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
