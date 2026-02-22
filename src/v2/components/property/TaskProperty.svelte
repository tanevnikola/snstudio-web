<script>
  import { getContext } from 'svelte';

  const selection = getContext('selection');
  let selectedYaml = $derived(selection.yaml);
</script>

{#if selectedYaml}
  <div class="task-property">
    <div class="header">{selectedYaml.t ?? 'Unknown'}</div>
    <pre class="yaml-preview">{JSON.stringify(selectedYaml, null, 2)}</pre>
  </div>
{:else}
  <div class="empty">No task selected</div>
{/if}

<style>
  .task-property {
    padding: 0.75rem;
  }

  .header {
    font-size: 0.85rem;
    font-weight: 600;
    color: #222;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 0.5rem;
  }

  .yaml-preview {
    font-size: 0.7rem;
    color: #555;
    background: #f8f8f8;
    padding: 0.5rem;
    border-radius: 4px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .empty {
    padding: 1rem;
    color: #999;
    font-size: 0.8rem;
    text-align: center;
  }
</style>
