<script>
  import { project, renameActor, removeActor } from '../../lib/projectStore.svelte.js';

  let { actorId } = $props();

  let actor = $derived(project.actors.find(a => a.id === actorId));
  let serviceCount = $derived(actor?.sections.services.items.length ?? 0);

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
      <button type="button" class="delete-btn" onclick={() => removeActor(actorId)}>Delete Actor</button>
    </div>
  </div>
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
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-input {
    padding: 0.4rem 0.6rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    color: #111;
    background: white;
  }

  .field-input:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 2.5px rgba(0, 122, 255, 0.18);
  }

  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-top: 1px solid #eee;
  }

  .info-label {
    font-size: 0.85rem;
    color: #555;
  }

  .info-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #111;
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
