<script>
  import { project, renameService, removeService, setServiceFunction } from '../../lib/projectStore.svelte.js';
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
      const fn = project.functions.find(f => f.id === value);
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
        {#each project.functions as fn (fn.id)}
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
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-input,
  .field-select {
    padding: 0.4rem 0.6rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    color: #111;
    background: white;
  }

  .field-input:focus,
  .field-select:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 2.5px rgba(0, 122, 255, 0.18);
  }

  .actions {
    padding-top: 0.5rem;
  }

  .delete-btn {
    background: none;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-family: inherit;
    color: #d32f2f;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .delete-btn:hover {
    background: rgba(211, 47, 47, 0.06);
    border-color: #d32f2f;
  }
</style>
