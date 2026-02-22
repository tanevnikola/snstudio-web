<script>
  import ConfirmButton from './ConfirmButton.svelte';

  let { onclick = () => {} } = $props();
</script>

<ConfirmButton {onclick}>
  {#snippet initial()}
    <span class="icon close">✕</span>
  {/snippet}
  {#snippet confirm()}
    <span class="icon check">✓</span>
  {/snippet}
</ConfirmButton>

<style>
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .close {
    color: #888;
    background: transparent;
  }

  .close:hover {
    color: #666;
    background: rgba(0, 0, 0, 0.05);
  }

  .check {
    color: white;
    background: #d32f2f;
  }
</style>
