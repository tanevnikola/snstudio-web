<script>
  import { marked } from 'marked';

  let { url, title = '', pinned = false, onclose, onmouseenter, onmouseleave } = $props();

  let contentEl = $state(null);
  let loading = $state(true);
  let history = $state([]);
  let historyIndex = $state(-1);

  let canGoBack = $derived(historyIndex > 0);
  let canGoForward = $derived(historyIndex < history.length - 1);

  let currentHtml = $state('');

  async function loadUrl(targetUrl, pushHistory = true) {
    loading = true;
    try {
      const res = await fetch(targetUrl);
      const text = await res.text();
      const html = await marked(text);

      if (pushHistory) {
        history = [...history.slice(0, historyIndex + 1), { url: targetUrl, html }];
        historyIndex = history.length - 1;
      }

      currentHtml = html;
    } catch {
      currentHtml = '<p>Failed to load documentation.</p>';
    }
    loading = false;
  }

  function onContentClick(e) {
    const link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();
    const href = link.getAttribute('href');
    if (!href) return;
    const base = new URL(history[historyIndex]?.url || url, window.location.origin);
    const resolved = new URL(href, base).href;
    loadUrl(resolved);
  }

  function goBack() {
    if (!canGoBack) return;
    historyIndex--;
    currentHtml = history[historyIndex].html;
  }

  function goForward() {
    if (!canGoForward) return;
    historyIndex++;
    currentHtml = history[historyIndex].html;
  }

  $effect(() => {
    if (url) loadUrl(url);
  });

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) onclose?.();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') onclose?.();
  }

  function openInTab(e) {
    e.stopPropagation();
    e.preventDefault();
    const currentUrl = history[historyIndex]?.url || url;
    window.open(currentUrl, '_blank');
    onclose?.();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if pinned}
  <div class="backdrop" role="button" tabindex="0" onclick={onBackdropClick} onkeydown={onKeydown}></div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popover" onmouseenter={onmouseenter} onmouseleave={onmouseleave}>
  <div class="header">
    {#if pinned}
      <button class="nav-btn" onclick={goBack} disabled={!canGoBack} title="Back">&larr;</button>
      <button class="nav-btn" onclick={goForward} disabled={!canGoForward} title="Forward">&rarr;</button>
    {/if}
    <span class="title">{title}</span>
    <a class="tab-link" href={url} onclick={openInTab}>Open in new tab</a>
    {#if pinned}
      <button class="close-btn" onclick={() => onclose?.()}>&times;</button>
    {/if}
  </div>
  {#if loading}
    <p class="loading-msg">Loading...</p>
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="content" bind:this={contentEl} onclick={onContentClick}>
      {@html currentHtml}
    </div>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 1000;
  }

  .popover {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    max-width: 90vw;
    height: 520px;
    max-height: 85vh;
    background: white;
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 1001;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #f7f7f7;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #444;
  }

  .tab-link {
    margin-left: auto;
    font-size: 0.7rem;
    color: #1a73e8;
    text-decoration: none;
  }

  .tab-link:hover {
    text-decoration: underline;
  }

  .nav-btn {
    background: none;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 0.75rem;
    color: #666;
    cursor: pointer;
    padding: 2px 6px;
    line-height: 1;
  }

  .nav-btn:hover:not(:disabled) {
    background: #eee;
    color: #333;
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1rem;
    color: #999;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }

  .close-btn:hover {
    color: #333;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.55;
    color: #333;
  }

  .content :global(h1) { font-size: 1.2rem; margin: 0 0 0.5rem; color: #222; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
  .content :global(h2) { font-size: 1rem; margin: 1rem 0 0.4rem; color: #222; }
  .content :global(h3) { font-size: 0.9rem; margin: 0.8rem 0 0.3rem; color: #333; }
  .content :global(p) { margin: 0.4rem 0; }
  .content :global(ul), .content :global(ol) { margin: 0.4rem 0; padding-left: 1.5rem; }
  .content :global(li) { margin: 0.15rem 0; }
  .content :global(pre) { background: #f5f5f5; padding: 0.6rem 0.8rem; border-radius: 5px; overflow-x: auto; font-size: 0.75rem; margin: 0.5rem 0; }
  .content :global(code) { font-size: 0.78rem; font-family: 'SF Mono', Menlo, Monaco, monospace; }
  .content :global(:not(pre) > code) { background: #f0f0f0; padding: 0.1rem 0.3rem; border-radius: 3px; }
  .content :global(table) { border-collapse: collapse; width: 100%; font-size: 0.78rem; margin: 0.5rem 0; }
  .content :global(th), .content :global(td) { border: 1px solid #ddd; padding: 0.35rem 0.5rem; text-align: left; }
  .content :global(th) { background: #f7f7f7; font-weight: 600; }
  .content :global(blockquote) { border-left: 3px solid #ddd; margin: 0.5rem 0; padding: 0.2rem 0.8rem; color: #666; }
  .content :global(hr) { border: none; border-top: 1px solid #eee; margin: 0.8rem 0; }
  .content :global(a) { color: #1a73e8; cursor: pointer; text-decoration: none; }
  .content :global(a:hover) { text-decoration: underline; }

  .loading-msg {
    padding: 2rem;
    text-align: center;
    color: #999;
    font-size: 0.8rem;
  }
</style>
