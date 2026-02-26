<script>
  import hljs from 'highlight.js/lib/core';
  import twigLang from 'highlight.js/lib/languages/twig';
  import CodeEditor from './CodeEditor.svelte';

  hljs.registerLanguage('twig', twigLang);

  let { text = '', highlightRange = null, style = '', collapsed = false, canEdit = true, onchange = () => {} } = $props();

  let readonlyMode = $state(false);
  let copyLabel = $state('Copy');
  let screenEl;

  $effect(() => {
    if (!screenEl || collapsed) return;
    const lineCount = (text.match(/\n/g) || []).length + 1;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const lineH = 1.17 * rem;
    const pad = 0.75 * rem * 2;
    const headerH = 28;
    const contentH = headerH + pad + lineCount * lineH;
    screenEl.style.height = Math.min(contentH, 400) + 'px';
  });

  let highlightedHtml = $derived(
    text ? hljs.highlight(text, { language: 'twig' }).value : ''
  );

  function copyText() {
    navigator.clipboard.writeText(text).then(() => {
      copyLabel = 'Copied!';
      setTimeout(() => (copyLabel = 'Copy'), 1500);
    });
  }
</script>

<div class="pebble-screen" class:collapsed style={collapsed ? '' : style} bind:this={screenEl}>
  <div class="header">
    <button class="collapse-btn" onclick={() => (collapsed = !collapsed)}>
      <span class="arrow">{collapsed ? '▶' : '▼'}</span>
      <span class="title">Pebble</span>
    </button>
    <span class="actions">
      {#if canEdit}
        <button class="edit-toggle" class:active={!readonlyMode} onclick={() => (readonlyMode = !readonlyMode)} title={readonlyMode ? 'Enable editing' : 'Disable editing'}>Edit</button>
      {/if}
      <button class="copy-btn" onclick={copyText}>{copyLabel}</button>
    </span>
  </div>
  {#if !collapsed}
    <CodeEditor {text} {highlightedHtml} {highlightRange} readonly={readonlyMode} {onchange} />
  {/if}
</div>

<style>
  .pebble-screen {
    display: flex;
    flex-direction: column;
    background: #1e1e2e;
    overflow: auto;
    resize: vertical;
  }

  .pebble-screen.collapsed {
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

  /* Catppuccin Mocha syntax colors for Pebble/Twig templates */
  .pebble-screen :global(.hljs-template-tag) {
    color: #cba6f7;
  }

  .pebble-screen :global(.hljs-template-variable) {
    color: #f38ba8;
  }

  .pebble-screen :global(.hljs-keyword) {
    color: #cba6f7;
  }

  .pebble-screen :global(.hljs-string) {
    color: #a6e3a1;
  }

  .pebble-screen :global(.hljs-number) {
    color: #fab387;
  }

  .pebble-screen :global(.hljs-literal) {
    color: #fab387;
  }

  .pebble-screen :global(.hljs-name) {
    color: #89b4fa;
  }

  .pebble-screen :global(.hljs-comment) {
    color: #6c7086;
    font-style: italic;
  }

  .pebble-screen :global(.hljs-attr) {
    color: #89b4fa;
  }

  .pebble-screen :global(.hljs-operator) {
    color: #94e2d5;
  }

  .pebble-screen :global(.hljs-punctuation) {
    color: #bac2de;
  }

  .pebble-screen :global(.hljs-variable) {
    color: #f38ba8;
  }
</style>
