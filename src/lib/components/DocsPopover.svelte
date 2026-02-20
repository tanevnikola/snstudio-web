<script>
  import { marked } from 'marked';

  let { url, title = '', pinned = false, onclose, onmouseenter, onmouseleave } = $props();
  let html = $state('');
  let loading = $state(true);

  $effect(() => {
    loading = true;
    html = '';
    fetch(url)
      .then((r) => r.text())
      .then((text) => {
        html = marked(text);
        loading = false;
      })
      .catch(() => {
        html = '<p class="error">Failed to load documentation.</p>';
        loading = false;
      });
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
    window.open(url, '_blank');
    onclose?.();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if pinned}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={onBackdropClick}>
    <div class="popover pinned">
      <div class="header">
        <span class="title">{title}</span>
        <a class="tab-link" href={url} onclick={openInTab}>Open in new tab</a>
        <button class="close-btn" onclick={() => onclose?.()}>&times;</button>
      </div>
      <div class="content">
        {#if loading}
          <p class="loading-msg">Loading...</p>
        {:else}
          {@html html}
        {/if}
      </div>
    </div>
  </div>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="popover hover" onmouseenter={onmouseenter} onmouseleave={onmouseleave}>
    <div class="header">
      <span class="title">{title}</span>
      <a class="tab-link" href={url} onclick={openInTab}>Open in new tab</a>
    </div>
    <div class="content">
      {#if loading}
        <p class="loading-msg">Loading...</p>
      {:else}
        {@html html}
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .popover {
    background: white;
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .popover.pinned {
    width: 700px;
    max-width: 90vw;
    height: 520px;
    max-height: 85vh;
  }

  .popover.hover {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    max-width: 85vw;
    height: 400px;
    max-height: 70vh;
    z-index: 1000;
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
    padding: 0.75rem 1rem;
    font-size: 0.82rem;
    line-height: 1.55;
    color: #333;
  }

  .content :global(h1) {
    font-size: 1.2rem;
    margin: 0 0 0.5rem;
    color: #222;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.3rem;
  }

  .content :global(h2) {
    font-size: 1rem;
    margin: 1rem 0 0.4rem;
    color: #222;
  }

  .content :global(h3) {
    font-size: 0.9rem;
    margin: 0.8rem 0 0.3rem;
    color: #333;
  }

  .content :global(p) {
    margin: 0.4rem 0;
  }

  .content :global(ul),
  .content :global(ol) {
    margin: 0.4rem 0;
    padding-left: 1.5rem;
  }

  .content :global(li) {
    margin: 0.15rem 0;
  }

  .content :global(pre) {
    background: #f5f5f5;
    padding: 0.6rem 0.8rem;
    border-radius: 5px;
    overflow-x: auto;
    font-size: 0.75rem;
    margin: 0.5rem 0;
  }

  .content :global(code) {
    font-size: 0.78rem;
    font-family: 'SF Mono', Menlo, Monaco, monospace;
  }

  .content :global(:not(pre) > code) {
    background: #f0f0f0;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }

  .content :global(table) {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.78rem;
    margin: 0.5rem 0;
  }

  .content :global(th),
  .content :global(td) {
    border: 1px solid #ddd;
    padding: 0.35rem 0.5rem;
    text-align: left;
  }

  .content :global(th) {
    background: #f7f7f7;
    font-weight: 600;
  }

  .content :global(blockquote) {
    border-left: 3px solid #ddd;
    margin: 0.5rem 0;
    padding: 0.2rem 0.8rem;
    color: #666;
  }

  .content :global(hr) {
    border: none;
    border-top: 1px solid #eee;
    margin: 0.8rem 0;
  }

  .loading-msg {
    padding: 2rem;
    text-align: center;
    color: #999;
    font-size: 0.8rem;
  }

  .error {
    padding: 1rem;
    color: #999;
  }
</style>
