<script>
  import ConfirmDeleteButton from '../ConfirmDeleteButton.svelte';
  import {
    project, selection,
    addActor, removeActor, renameActor, selectActor,
  } from '../../store/projectStore.svelte.js';

  let { onselect = null } = $props();

  let renamingName = $state(null);
  let renameValue = $state('');
  let renameInput = $state(null);

  let actors = $derived(Object.keys(project.actors));

  function startRename(name) {
    renamingName = name;
    renameValue = name;
    setTimeout(() => renameInput?.focus(), 0);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== renamingName) renameActor(renamingName, trimmed);
    renamingName = null;
  }

  function onRenameKeydown(e) {
    if (e.key === 'Enter') commitRename();
    else if (e.key === 'Escape') renamingName = null;
  }

  function handleAdd() {
    let name = 'actor';
    let n = 2;
    while (name in project.actors) name = `actor-${n++}`;
    addActor(name);
    startRename(name);
  }
</script>

<div class="section">
  <div class="section-header">
    <span class="section-label">Actors</span>
    <span class="section-count">{actors.length}</span>
    <button type="button" class="add-btn" onclick={handleAdd} title="Add actor">+</button>
  </div>

  <div class="items">
    {#each actors as name (name)}
      <div
        class="row"
        class:selected={selection.actorName === name && selection.functionScope === null}
        onclick={() => onselect ? onselect(name) : selectActor(name)}
      >
        {#if renamingName === name}
          <input
            class="rename-input"
            bind:this={renameInput}
            bind:value={renameValue}
            onclick={(e) => e.stopPropagation()}
            onblur={commitRename}
            onkeydown={onRenameKeydown}
          />
        {:else}
          <span
            class="name"
            ondblclick={(e) => { e.stopPropagation(); startRename(name); }}
          >{name}</span>
        {/if}

        <span class="row-actions" onclick={(e) => e.stopPropagation()}>
          <ConfirmDeleteButton onclick={() => removeActor(name)} />
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .section {
    display: flex;
    flex-direction: column;
  }

  /* ── Section header ──────────────────────────────────────── */

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    min-height: 28px;
    padding: 0 0.5rem 0 0.75rem;
  }

  .section-header:hover .add-btn {
    color: var(--primary);
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    flex: 1;
  }

  .section-count {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-right: 0.25rem;
  }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: none;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    color: transparent;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.1s, background 0.1s;
  }

  .add-btn:hover {
    background: var(--primary-subtle);
  }

  /* ── Rows ────────────────────────────────────────────────── */

  .items {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    align-items: center;
    min-height: 28px;
    padding: 0 0.5rem 0 1.1rem;
    gap: 0.15rem;
    cursor: pointer;
    transition: background 0.08s;
  }

  .row:hover:not(.selected) {
    background: var(--surface-3);
  }

  .row.selected {
    background: var(--primary);
    color: white;
  }

  .name {
    flex: 1;
    font-size: 0.82rem;
    font-weight: 500;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0.1rem 0.25rem;
  }

  .rename-input {
    flex: 1;
    min-width: 0;
    padding: 0.1rem 0.25rem;
    border: 1px solid var(--primary);
    border-radius: 3px;
    font-family: inherit;
    font-size: 0.82rem;
    outline: none;
    background: var(--surface-2);
    color: var(--text-primary);
  }

  .row-actions {
    opacity: 0;
    transition: opacity 0.1s;
    flex-shrink: 0;
  }

  .row:hover .row-actions {
    opacity: 1;
  }

  .row.selected .row-actions {
    opacity: 1;
  }
</style>
