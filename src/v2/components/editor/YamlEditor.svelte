<script>
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';
  import jsYaml from 'js-yaml';
  import CodeEditor from './CodeEditor.svelte';

  hljs.registerLanguage('yaml', yamlLang);

  let { yamlText = '', highlightRange = null, style = '', collapsed = false, canEdit = true, oninput = null, onchange = () => {} } = $props();

  let readonlyMode = $state(true);
  let copyLabel = $state('Copy');
  let liveText = $state(yamlText);

  $effect(() => { liveText = yamlText; });

  let highlightedHtml = $derived(
    liveText ? hljs.highlight(liveText, { language: 'yaml' }).value : ''
  );

  function handleInput(text) {
    liveText = text;
    oninput?.(text);
  }

  /** Normalize edited YAML: parse and re-dump to strip comments/blank lines. */
  function handleChange(text) {
    try {
      const obj = jsYaml.load(text);
      if (obj != null) {
        const normalized = jsYaml.dump(obj, { lineWidth: -1, noRefs: true });
        liveText = normalized;
        onchange(normalized);
        return;
      }
    } catch {}
    onchange(text);
  }

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
    <CodeEditor text={liveText} {highlightedHtml} {highlightRange} readonly={readonlyMode} oninput={handleInput} onchange={handleChange} />
  {/if}
</div>

<style>
  .yaml-screen {
    display: flex;
    flex-direction: column;
    background: var(--editor-bg);
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
    background: var(--editor-header);
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
    color: var(--editor-text);
  }

  .arrow {
    font-size: 0.55rem;
    color: var(--editor-muted);
    width: 0.65rem;
  }

  .title {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--editor-muted);
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
    border: 1px solid var(--editor-border);
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
    color: var(--editor-muted);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    font-family: inherit;
  }

  .copy-btn:hover {
    color: var(--editor-text);
    border-color: var(--editor-muted);
  }

  .edit-toggle {
    background: none;
    border: 1px solid var(--editor-border);
    border-radius: 4px;
    padding: 0.15rem 0.5rem;
    font-size: 0.65rem;
    color: var(--editor-muted);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    font-family: inherit;
  }

  .edit-toggle:hover {
    color: var(--editor-text);
    border-color: var(--editor-muted);
  }

  .edit-toggle.active {
    color: var(--primary);
    border-color: var(--primary);
    background: var(--primary-subtle);
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
