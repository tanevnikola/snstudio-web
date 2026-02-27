<script>
  import { project, renameActor, removeActor } from '../../lib/projectStore.svelte.js';
  import ConfirmDialog from '../../lib/components/ConfirmDialog.svelte';

  let { actorId } = $props();

  let actor = $derived(project.actors.find(a => a.id === actorId));
  let serviceCount = $derived(actor?.sections.services.items.length ?? 0);
  let showConfirm = $state(false);

  function onNameInput(e) {
    renameActor(actorId, e.target.value);
  }
</script>

{#if actor}
  <div class="actor-detail">
    <label class="field">
      <span class="field-label">Name</span>
      <input class="field-input" type="text" value={actor.name} oninput={onNameInput} />
    </label>

    <div class="info-row">
      <span class="info-label">Services</span>
      <span class="info-value">{serviceCount}</span>
    </div>

    <div class="actions">
      <button type="button" class="delete-btn" onclick={() => { showConfirm = true; }}>Delete Actor</button>
    </div>
  </div>
{/if}

{#if showConfirm && actor}
  <ConfirmDialog
    message={`Delete actor "${actor.name}"? This cannot be undone.`}
    confirmLabel="Delete"
    onConfirm={() => { removeActor(actorId); showConfirm = false; }}
    onCancel={() => { showConfirm = false; }}
  />
{/if}

<style>
  .actor-detail {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-input {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    color: var(--text-primary);
    background: var(--surface-2);
  }

  .field-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2.5px var(--primary-subtle);
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-top: 1px solid var(--border-subtle);
  }

  .info-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .info-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .actions {
    padding-top: 0.5rem;
  }

  .delete-btn {
    background: none;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-family: inherit;
    color: var(--danger);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .delete-btn:hover {
    background: var(--danger-subtle);
    border-color: var(--danger);
  }
</style>
