<script>
  let { yaml, parameterSpec } = $props();
  let parameterName = $derived(parameterSpec?.name ?? null);
  let value = $derived(yaml?.[parameterName] ?? '');
  let multiline = $state(false);
</script>

<div class="string-value">
  <button class="multiline-toggle" class:active={multiline}
    onclick={() => multiline = !multiline}
    title={multiline ? 'Single line' : 'Multi line'}>
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M3 5h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3z"/>
    </svg>
  </button>
  {#if multiline}
    <textarea rows="4" value={value} oninput={(e) => yaml[parameterName] = /** @type {HTMLTextAreaElement} */ (e.target).value}></textarea>
  {:else}
    <input type="text" value={value} oninput={(e) => yaml[parameterName] = /** @type {HTMLInputElement} */ (e.target).value} />
  {/if}
</div>

<style>
  .string-value {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
  }
  .multiline-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    color: #bbb;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .multiline-toggle:hover {
    background: #f5f5f5;
    color: #888;
  }
  .multiline-toggle.active {
    background: #e3f2fd;
    border-color: #4a9eff;
    color: #4a9eff;
  }
  input, textarea {
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
    resize: vertical;
  }
  input:focus, textarea:focus {
    outline: none;
    border-color: #4a9eff;
  }
</style>
