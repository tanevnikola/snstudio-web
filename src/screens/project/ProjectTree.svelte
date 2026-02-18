<script>
  import {
    project, persistProject,
    addActor, removeActor, renameActor,
    addService, removeService, renameService,
    selectActor, selectService,
    toggleActorCollapsed, toggleSectionCollapsed,
  } from '../../lib/projectStore.svelte.js';

  let { onOpenService } = $props();

  // Inline rename state
  let renamingId = $state(null);
  let renameValue = $state('');
  let renameInput = $state(null);

  function startRename(id, currentName) {
    renamingId = id;
    renameValue = currentName;
    // Focus the input after Svelte renders it
    setTimeout(() => renameInput?.focus(), 0);
  }

  function commitRename(type, actorId, serviceId) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      if (type === 'actor') renameActor(actorId, trimmed);
      else renameService(actorId, serviceId, trimmed);
    }
    renamingId = null;
  }

  function onRenameKeydown(e, type, actorId, serviceId) {
    if (e.key === 'Enter') commitRename(type, actorId, serviceId);
    else if (e.key === 'Escape') renamingId = null;
  }

  function handleAddService(actorId) {
    const svc = addService(actorId);
    if (svc) {
      // Ensure actor + services section is expanded
      const actor = project.actors.find(a => a.id === actorId);
      if (actor) {
        if (actor.collapsed) actor.collapsed = false;
        if (actor.sections.services.collapsed) actor.sections.services.collapsed = false;
        persistProject();
      }
      selectService(actorId, svc.id);
      startRename(svc.id, svc.name);
    }
  }

  function handleAddActor() {
    const actor = addActor();
    selectActor(actor.id);
    startRename(actor.id, actor.name);
  }
</script>

<div class="tree">
  {#each project.actors as actor (actor.id)}
    <div class="tree-group">
      <!-- Actor row -->
      <div
        class="tree-row actor-row"
        class:selected={project.selectedActorId === actor.id && !project.selectedServiceId}
      >
        <button
          type="button"
          class="arrow-btn"
          onclick={() => toggleActorCollapsed(actor.id)}
          aria-label={actor.collapsed ? 'Expand' : 'Collapse'}
        >
          <span class="arrow">{actor.collapsed ? '▶' : '▼'}</span>
        </button>

        {#if renamingId === actor.id}
          <input
            class="rename-input"
            bind:this={renameInput}
            bind:value={renameValue}
            onblur={() => commitRename('actor', actor.id)}
            onkeydown={(e) => onRenameKeydown(e, 'actor', actor.id)}
          />
        {:else}
          <button
            type="button"
            class="name-btn"
            onclick={() => selectActor(actor.id)}
            ondblclick={() => startRename(actor.id, actor.name)}
          >{actor.name}</button>
        {/if}

        <button type="button" class="action-btn delete-btn" onclick={() => removeActor(actor.id)} title="Delete actor" aria-label="Delete actor">×</button>
      </div>

      <!-- Children -->
      {#if !actor.collapsed}
        <div class="tree-children">
          <!-- Services section -->
          <div class="tree-section">
            <button
              type="button"
              class="tree-row section-row"
              onclick={() => toggleSectionCollapsed(actor.id, 'services')}
            >
              <span class="arrow">{actor.sections.services.collapsed ? '▶' : '▼'}</span>
              <span class="section-label">Services</span>
              <span class="section-count">{actor.sections.services.items.length}</span>
            </button>

            {#if !actor.sections.services.collapsed}
              {#each actor.sections.services.items as service (service.id)}
                <div
                  class="tree-row service-row"
                  class:selected={project.selectedServiceId === service.id}
                >
                  {#if renamingId === service.id}
                    <input
                      class="rename-input"
                      bind:this={renameInput}
                      bind:value={renameValue}
                      onblur={() => commitRename('service', actor.id, service.id)}
                      onkeydown={(e) => onRenameKeydown(e, 'service', actor.id, service.id)}
                    />
                  {:else}
                    <button
                      type="button"
                      class="name-btn service-name"
                      onclick={() => selectService(actor.id, service.id)}
                      ondblclick={() => onOpenService(actor.id, service.id)}
                    >{service.name}</button>
                  {/if}

                  <button type="button" class="action-btn delete-btn" onclick={() => removeService(actor.id, service.id)} title="Delete service" aria-label="Delete service">×</button>
                </div>
              {/each}

              <button type="button" class="add-btn" onclick={() => handleAddService(actor.id)}>+ Service</button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/each}

  <button type="button" class="add-btn add-actor-btn" onclick={handleAddActor}>+ Actor</button>
</div>

<style>
  .tree {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
    font-size: 0.82rem;
    user-select: none;
  }

  .tree-group {
    display: flex;
    flex-direction: column;
  }

  /* ── Rows ──────────────────────────────────────────────── */

  .tree-row {
    display: flex;
    align-items: center;
    min-height: 28px;
    padding: 0 0.5rem;
    gap: 0.15rem;
  }

  .tree-row.selected {
    background: #007aff;
    color: white;
  }

  .tree-row.selected .action-btn {
    color: rgba(255, 255, 255, 0.6);
  }

  .tree-row.selected .action-btn:hover {
    color: white;
  }

  .actor-row {
    padding-left: 0.35rem;
  }

  .section-row {
    padding-left: 1.6rem;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  .section-row:hover {
    background: #eee;
  }

  .service-row {
    padding-left: 2.6rem;
  }

  .service-row:hover:not(.selected) {
    background: #eee;
  }

  /* ── Arrow + name buttons ──────────────────────────────── */

  .arrow-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    color: inherit;
  }

  .arrow {
    font-size: 0.5rem;
    line-height: 1;
    color: #999;
  }

  .tree-row.selected .arrow {
    color: rgba(255, 255, 255, 0.7);
  }

  .name-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.1rem 0.25rem;
    border-radius: 3px;
    font-family: inherit;
    font-size: inherit;
    font-weight: 500;
    color: inherit;
    text-align: left;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .name-btn:hover {
    text-decoration: underline;
  }

  .service-name {
    font-weight: 400;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #888;
    flex: 1;
  }

  .section-count {
    font-size: 0.65rem;
    color: #aaa;
    margin-right: 0.25rem;
  }

  /* ── Action buttons ────────────────────────────────────── */

  .action-btn {
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
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.1s;
  }

  .tree-row:hover .action-btn {
    color: #bbb;
  }

  .tree-row:hover .action-btn:hover {
    color: #d32f2f;
    background: rgba(211, 47, 47, 0.08);
  }

  /* ── Inline rename ─────────────────────────────────────── */

  .rename-input {
    flex: 1;
    min-width: 0;
    padding: 0.1rem 0.25rem;
    border: 1px solid #007aff;
    border-radius: 3px;
    font-family: inherit;
    font-size: inherit;
    outline: none;
    background: white;
    color: #111;
  }

  /* ── Add buttons ───────────────────────────────────────── */

  .add-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.72rem;
    color: #007aff;
    padding: 0.3rem 0.5rem;
    text-align: left;
    padding-left: 2.85rem;
  }

  .add-btn:hover {
    text-decoration: underline;
  }

  .add-actor-btn {
    padding-left: 1.1rem;
    margin-top: 0.25rem;
    border-top: 1px solid #eee;
    padding-top: 0.5rem;
  }

  /* ── Children indentation ──────────────────────────────── */

  .tree-children {
    display: flex;
    flex-direction: column;
  }
</style>
