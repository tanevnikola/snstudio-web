<script>
  import {
    project, persistProject, getCurrentProjectId,
    addActor, removeActor, renameActor,
    addService, removeService, renameService,
    selectActor, selectService,
    toggleActorCollapsed, toggleSectionCollapsed,
    toggleProjectSectionCollapsed,
  } from '../../lib/projectStore.svelte.js';
  import { projectsList, renameProject } from '../../lib/projectsStore.svelte.js';
  import ConfirmDialog from '../../lib/components/ConfirmDialog.svelte';

  let currentProjectId = $derived(getCurrentProjectId());
  let projectEntry = $derived(projectsList.projects.find(p => p.id === currentProjectId));

  // Confirm delete state
  let confirmDelete = $state(null); // { type: 'actor'|'service', actorId, serviceId?, name }

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
      if (type === 'project') renameProject(currentProjectId, trimmed);
      else if (type === 'actor') renameActor(actorId, trimmed);
      else renameService(actorId, serviceId, trimmed);
    }
    renamingId = null;
  }

  function onRenameKeydown(e, type, actorId, serviceId) {
    if (e.key === 'Enter') commitRename(type, actorId, serviceId);
    else if (e.key === 'Escape') renamingId = null;
  }

  function selectProjectRoot() {
    project.selectedActorId = null;
    project.selectedServiceId = null;
    persistProject();
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
  <!-- Project root node -->
  {#if projectEntry}
    <div
      class="tree-row project-row"
      class:selected={!project.selectedActorId && !project.selectedServiceId}
    >
      <span class="project-icon">&#9670;</span>

      {#if renamingId === 'project-root'}
        <input
          class="rename-input"
          bind:this={renameInput}
          bind:value={renameValue}
          onblur={() => commitRename('project')}
          onkeydown={(e) => onRenameKeydown(e, 'project')}
        />
      {:else}
        <button
          type="button"
          class="name-btn project-name"
          onclick={selectProjectRoot}
          ondblclick={() => startRename('project-root', projectEntry.name)}
        >{projectEntry.name}</button>
      {/if}
    </div>
  {/if}

  <!-- Project sections -->
  <div class="project-children">
    <!-- Actors section -->
    <div class="tree-section">
      <button
        type="button"
        class="tree-row project-section-row"
        onclick={() => toggleProjectSectionCollapsed('actors')}
      >
        <span class="arrow">{project.sections.actors?.collapsed ? '▶' : '▼'}</span>
        <span class="section-label">Actors</span>
        <span class="section-count">{project.actors.length}</span>
      </button>

      {#if !project.sections.actors?.collapsed}
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

              <button type="button" class="action-btn delete-btn" onclick={() => { confirmDelete = { type: 'actor', actorId: actor.id, name: actor.name }; }} title="Delete actor" aria-label="Delete actor">&times;</button>
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
                            ondblclick={() => startRename(service.id, service.name)}
                          >{service.name}</button>
                        {/if}

                        <button type="button" class="action-btn delete-btn" onclick={() => { confirmDelete = { type: 'service', actorId: actor.id, serviceId: service.id, name: service.name }; }} title="Delete service" aria-label="Delete service">&times;</button>
                      </div>
                    {/each}

                    <button type="button" class="add-btn add-service-btn" onclick={() => handleAddService(actor.id)}>+ Service</button>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}

        <button type="button" class="add-btn add-actor-btn" onclick={handleAddActor}>+ Actor</button>
      {/if}
    </div>
  </div>
</div>

{#if confirmDelete}
  <ConfirmDialog
    message={`Delete ${confirmDelete.type} "${confirmDelete.name}"? This cannot be undone.`}
    confirmLabel="Delete"
    onConfirm={() => {
      if (confirmDelete.type === 'actor') removeActor(confirmDelete.actorId);
      else if (confirmDelete.type === 'service') removeService(confirmDelete.actorId, confirmDelete.serviceId);
      confirmDelete = null;
    }}
    onCancel={() => { confirmDelete = null; }}
  />
{/if}

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

  /* ── Project root ───────────────────────────────────────── */

  .project-row {
    padding-left: 0.35rem;
  }

  .project-icon {
    font-size: 0.5rem;
    color: #999;
    width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .tree-row.selected .project-icon {
    color: rgba(255, 255, 255, 0.7);
  }

  .project-name {
    font-weight: 600;
  }

  .project-children {
    display: flex;
    flex-direction: column;
  }

  /* ── Project section row ─────────────────────────────────── */

  .project-section-row {
    padding-left: 1.1rem;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  .project-section-row:hover {
    background: #eee;
  }

  /* ── Actor / Section / Service rows ─────────────────────── */

  .actor-row {
    padding-left: 1.85rem;
  }

  .section-row {
    padding-left: 3.1rem;
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
    padding-left: 4.1rem;
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
  }

  .add-btn:hover {
    text-decoration: underline;
  }

  .add-service-btn {
    padding-left: 4.35rem;
  }

  .add-actor-btn {
    padding-left: 2.6rem;
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
