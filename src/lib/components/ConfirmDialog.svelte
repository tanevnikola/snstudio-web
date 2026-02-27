<script>
  let {
    message = 'Are you sure?',
    confirmLabel = 'Yes',
    cancelLabel = 'No',
    onConfirm,
    onCancel,
  } = $props();

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel?.();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') onCancel?.();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="backdrop" onclick={onBackdropClick}>
  <div class="dialog">
    <p class="message">{message}</p>
    <div class="actions">
      <button type="button" class="btn btn-cancel" onclick={() => onCancel?.()}>{cancelLabel}</button>
      <button type="button" class="btn btn-confirm" onclick={() => onConfirm?.()}>{confirmLabel}</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--surface-2);
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    max-width: 340px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  }

  .message {
    margin: 0 0 1rem;
    font-size: 0.88rem;
    color: var(--text-primary);
    line-height: 1.45;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn {
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.9rem;
    font-size: 0.82rem;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-cancel {
    background: var(--surface-3);
    color: var(--text-secondary);
  }

  .btn-cancel:hover {
    background: var(--border-default);
  }

  .btn-confirm {
    background: var(--danger);
    color: white;
  }

  .btn-confirm:hover {
    background: var(--danger-hover, #b71c1c);
  }
</style>
