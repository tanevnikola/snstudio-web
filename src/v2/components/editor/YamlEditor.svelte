<script>
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';
  import CodeEditor from './CodeEditor.svelte';

  hljs.registerLanguage('yaml', yamlLang);

  let { yamlText = '', highlightRange = null, style = '', collapsed = false, canEdit = true, onchange = () => {} } = $props();

  let readonlyMode = $state(true);
  let copyLabel = $state('Copy');

  let highlightedHtml = $derived(
    yamlText ? hljs.highlight(yamlText, { language: 'yaml' }).value : ''
  );

  function copyYaml() {
    navigator.clipboard.writeText(yamlText).then(() => {
      copyLabel = 'Copied!';
      setTimeout(() => (copyLabel = 'Copy'), 1500);
    });
  }
</script>

<div class="yaml-screen" class:collapsed style={collapsed ? '' : style}>
  <div class="header">
    <button class="collapse-btn" onclick={() => (collapsed = !collapsed)}>
      <span class="arrow">{collapsed ? '▶' : '▼'}</span>
      <span class="title">YAML</span>
    </button>
    <span class="actions">
      {#if canEdit}
        <button class="edit-toggle" class:active={!readonlyMode} onclick={() => (readonlyMode = !readonlyMode)} title={readonlyMode ? 'Enable editing' : 'Disable editing'}>Edit</button>
      {/if}
      <button class="copy-btn" onclick={copyYaml}>{copyLabel}</button>
    </span>
  </div>
  {#if !collapsed}
    <CodeEditor text={yamlText} {highlightedHtml} {highlightRange} readonly={readonlyMode} {onchange} />
  {/if}
</div>

<style>
  .yaml-screen {
    display: flex;
    flex-direction: column;
    background: #1e1e2e;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .yaml-screen.collapsed {
    flex: 0 0 auto;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: #181825;
    flex-shrink: 0;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .collapse-btn:hover .title,
  .collapse-btn:hover .arrow {
    color: #cdd6f4;
  }

  .arrow {
    font-size: 0.55rem;
    color: #6c7086;
    width: 0.65rem;
  }

  .title {
    font-size: 0.7rem;
    font-weight: 600;
    color: #6c7086;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
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

  .edit-toggle {
    background: none;
    border: 1px solid #45475a;
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
    color: #6c7086;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    font-family: inherit;
  }

  .edit-toggle:hover {
    color: #cdd6f4;
    border-color: #6c7086;
  }

  .edit-toggle.active {
    color: #a6e3a1;
    border-color: #a6e3a1;
    background: rgba(166, 227, 161, 0.1);
  }

  /* Catppuccin Mocha syntax colors for YAML */
  .yaml-screen :global(.hljs-attr) {
    color: #89b4fa;
  }

  .yaml-screen :global(.hljs-string) {
    color: #a6e3a1;
  }

  .yaml-screen :global(.hljs-number) {
    color: #fab387;
  }

  .yaml-screen :global(.hljs-literal) {
    color: #fab387;
  }

  .yaml-screen :global(.hljs-bullet) {
    color: #94e2d5;
  }

  .yaml-screen :global(.hljs-comment) {
    color: #6c7086;
    font-style: italic;
  }

  .yaml-screen :global(.hljs-meta) {
    color: #f5c2e7;
  }

  .yaml-screen :global(.hljs-section) {
    color: #89b4fa;
    font-weight: 600;
  }
</style>
