<script>
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';

  let { yaml = [] } = $props();

  let items = $derived(Array.isArray(yaml) ? yaml : []);
</script>

{#if items.length > 0}
  <div class="list">
    {#each items as item, i (i)}
      <DomainFunctionBlock yaml={item} />
    {/each}
  </div>
{/if}

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
</style>
