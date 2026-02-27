<script>
  import { project, renameService, removeService, setServiceFunction, getAllFunctions } from '../../lib/projectStore.svelte.js';
  import ConfirmDialog from '../../lib/components/ConfirmDialog.svelte';

  let { actorId, serviceId } = $props();

  let actor = $derived(project.actors.find(a => a.id === actorId));
  let service = $derived(actor?.sections.services.items.find(s => s.id === serviceId));
  let showConfirm = $state(false);

  function onNameInput(e) {
    renameService(actorId, serviceId, e.target.value);
  }

  function onFunctionChange(e) {
    const value = e.target.value;
    setServiceFunction(actorId, serviceId, value || null);
    if (value) {
      const fn = getAllFunctions().find(f => f.id === value);
      if (fn) renameService(actorId, serviceId, fn.name);
    }
  }
</script>

{#if service}
  <div class="service-detail">
    <label class="field">
      <span class="field-label">Name</span>
      <input class="field-input" type="text" value={service.name} oninput={onNameInput} />
    </label>

    <label class="field">
      <span class="field-label">Function</span>
      <select class="field-select" value={service.functionId ?? ''} onchange={onFunctionChange}>
        <option value="">— None —</option>
        {#each getAllFunctions() as fn (fn.id)}
          <option value={fn.id}>{fn.name}</option>
        {/each}
      </select>
    </label>

    <div class="actions">
      <button type="button" class="delete-btn" onclick={() => { showConfirm = true; }}>Delete Service</button>
    </div>
  </div>
{/if}

{#if showConfirm && service}
  <ConfirmDialog
    message={`Delete service "${service.name}"? This cannot be undone.`}
    confirmLabel="Delete"
    onConfirm={() => { removeService(actorId, serviceId); showConfirm = false; }}
    onCancel={() => { showConfirm = false; }}
  />
{/if}

<style>
  .service-detail {
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

  .field-input,
  .field-select {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    color: var(--text-primary);
    background: var(--surface-2);
  }

  .field-input:focus,
  .field-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2.5px var(--primary-subtle);
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
