<script>
  import ConfirmDeleteButton from '../ConfirmDeleteButton.svelte';

  let { title = '', detail = '', ondelete = () => {} } = $props();
</script>

<div class="block">
  <div class="info">
    <span class="title">{title}</span>
    {#if detail}
      <span class="detail">{detail}</span>
    {/if}
  </div>
  <div class="actions">
    <ConfirmDeleteButton onclick={ondelete} />
  </div>
</div>

<style>
  .block {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail {
    font-size: 0.7rem;
    color: #888;
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
</style>
