<script>
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';

  let { yaml = {} } = $props();

  let entries = $derived.by(() => {
    if (!yaml || typeof yaml !== 'object' || Array.isArray(yaml)) return [];
    return Object.entries(yaml);
  });
</script>

{#if entries.length > 0}
  <div class="map">
    {#each entries as [key, value] (key)}
      <div class="map-entry">
        <span class="map-key">{key}</span>
        <DomainFunctionBlock yaml={value} onremove={() => { delete yaml[key]; }} />
      </div>
    {/each}
  </div>
{/if}

<style>
  .map {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .map-entry {
    position: relative;
    border: 1px dashed var(--border-default);
    border-radius: 6px;
    padding: 0.5rem 0.5rem 0.5rem 0.5rem;
  }

  .map-key {
    position: absolute;
    top: -0.55rem;
    left: 0.5rem;
    background: var(--surface-1);
    padding: 0 0.3rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
</style>
