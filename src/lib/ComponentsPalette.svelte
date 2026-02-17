<script>
  import PaletteNode from './PaletteNode.svelte';

  const roots = [
    { mnemonic: 'FlowTask', label: 'Flow' },
    { mnemonic: 'EffectTask', label: 'Effect' },
    { mnemonic: 'TransformTask', label: 'Transform' },
  ];
</script>

<div class="palette">
  <h3>Components</h3>
  {#each roots as root (root.mnemonic)}
    <PaletteNode mnemonic={root.mnemonic} depth={0} defaultCollapsed={false} />
  {/each}
</div>

<style>
  .palette {
    padding: 0.75rem;
    overflow-y: auto;
  }

  h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
