<script>
  import {
    project, persistProject, getCurrentProjectId,
    addActor, removeActor, renameActor,
    addService, removeService, renameService,
    addFunction, addDirectory, removeFunction, renameFunction,
    selectActor, selectService, selectFunction,
    toggleActorCollapsed, toggleSectionCollapsed,
    toggleProjectSectionCollapsed, toggleDirectoryCollapsed,
  } from '../../lib/projectStore.svelte.js';
  import { projectsList, renameProject } from '../../lib/projectsStore.svelte.js';
  import ConfirmDialog from '../../lib/components/ConfirmDialog.svelte';

  let currentProjectId = $derived(getCurrentProjectId());
  let projectEntry = $derived(projectsList.projects.find(p => p.id === currentProjectId));

  // Confirm delete state
  let confirmDelete = $state(null); // { type: 'actor'|'service'|'function', actorId?, serviceId?, functionId?, name }

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

  function commitRename(type, id1, id2) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      if (type === 'project') renameProject(currentProjectId, trimmed);
      else if (type === 'actor') renameActor(id1, trimmed);
      else if (type === 'function') renameFunction(id1, trimmed);
      else renameService(id1, id2, trimmed);
    }
    renamingId = null;
  }

  function onRenameKeydown(e, type, id1, id2) {
    if (e.key === 'Enter') commitRename(type, id1, id2);
    else if (e.key === 'Escape') renamingId = null;
  }

  function selectProjectRoot() {
    project.selectedActorId = null;
    project.selectedServiceId = null;
    project.selectedFunctionId = null;
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

  function handleAddFunction(parentDirId = null) {
    const fn = addFunction('New Function', parentDirId);
    if (project.sections.functions?.collapsed) {
      project.sections.functions.collapsed = false;
      persistProject();
    }
    selectFunction(fn.id);
    startRename(fn.id, fn.name);
  }

  function handleAddDirectory(parentDirId = null) {
    const dir = addDirectory('New Directory', parentDirId);
    if (project.sections.functions?.collapsed) {
      project.sections.functions.collapsed = false;
      persistProject();
    }
    startRename(dir.id, dir.name);
  }

  // Add menu dropdown state
  let addMenu = $state(null); // { type, actorId?, dirId?, x, y }

  function openAddMenu(e, type, contextId) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    addMenu = { type, contextId, x: rect.left, y: rect.bottom + 2 };
  }

  function closeAddMenu() {
    addMenu = null;
  }

  function addMenuSelect(action) {
    const ctx = addMenu;
    closeAddMenu();
    if (action === 'actor') handleAddActor();
    else if (action === 'service') handleAddService(ctx.contextId);
    else if (action === 'function') handleAddFunction(ctx.contextId || null);
    else if (action === 'directory') handleAddDirectory(ctx.contextId || null);
  }

  const addMenuItems = {
    actors: [{ action: 'actor', label: 'Actor' }],
    services: [{ action: 'service', label: 'Service' }],
    functions: [{ action: 'function', label: 'Function' }, { action: 'directory', label: 'Directory' }],
    directory: [{ action: 'function', label: 'Function' }, { action: 'directory', label: 'Directory' }],
  };
</script>

<div class="tree">
  <!-- Project root node -->
  {#if projectEntry}
    <div
      class="tree-row project-row"
      class:selected={!project.selectedActorId && !project.selectedServiceId && !project.selectedFunctionId}
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
      <div class="tree-row project-section-row">
        <button
          type="button"
          class="section-toggle"
          onclick={() => toggleProjectSectionCollapsed('actors')}
        >
          <span class="section-label">Actors</span>
          <span class="section-count">{project.actors.length}</span>
        </button>
        <button type="button" class="section-add-btn" onclick={(e) => openAddMenu(e, 'actors')} title="Add actor">+</button>
      </div>

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
                  <div class="tree-row subsection-row">
                    <button
                      type="button"
                      class="arrow-btn"
                      onclick={() => toggleSectionCollapsed(actor.id, 'services')}
                      aria-label={actor.sections.services.collapsed ? 'Expand' : 'Collapse'}
                    >
                      <span class="arrow">{actor.sections.services.collapsed ? '▶' : '▼'}</span>
                    </button>
                    <span class="subsection-label">Services</span>
                    <span class="section-count">{actor.sections.services.items.length}</span>
                    <button type="button" class="section-add-btn" onclick={(e) => openAddMenu(e, 'services', actor.id)} title="Add service">+</button>
                  </div>

                  {#if !actor.sections.services.collapsed}
                    {#each actor.sections.services.items as service (service.id)}
                      <div
                        class="tree-row service-row"
                        class:selected={project.selectedServiceId === service.id}
                      >
                        <span class="arrow-spacer"></span>
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

                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}

      {/if}
    </div>

    <!-- Functions section -->
    <div class="tree-section">
      <div class="tree-row project-section-row">
        <button
          type="button"
          class="section-toggle"
          onclick={() => toggleProjectSectionCollapsed('functions')}
        >
          <span class="section-label">Functions</span>
          <span class="section-count">{project.functions.length}</span>
        </button>
        <button type="button" class="section-add-btn" onclick={(e) => openAddMenu(e, 'functions')} title="Add function">+</button>
      </div>

      {#if !project.sections.functions?.collapsed}
        {#snippet functionItems(items, depth)}
          {#each [...items].sort((a, b) => (a.type === 'directory' ? 0 : 1) - (b.type === 'directory' ? 0 : 1)) as item (item.id)}
            {#if item.type === 'directory'}
              <div class="tree-group">
                <div class="tree-row directory-row" style="padding-left: {2.1 + depth * 1.0}rem">
                  <button
                    type="button"
                    class="arrow-btn"
                    onclick={() => toggleDirectoryCollapsed(item.id)}
                    aria-label={item.collapsed ? 'Expand' : 'Collapse'}
                  >
                    <span class="arrow">{item.collapsed ? '▶' : '▼'}</span>
                  </button>

                  {#if renamingId === item.id}
                    <input
                      class="rename-input"
                      bind:this={renameInput}
                      bind:value={renameValue}
                      onblur={() => commitRename('function', item.id)}
                      onkeydown={(e) => onRenameKeydown(e, 'function', item.id)}
                    />
                  {:else}
                    <button
                      type="button"
                      class="name-btn"
                      ondblclick={() => startRename(item.id, item.name)}
                    >{item.name}</button>
                  {/if}

                  <button type="button" class="section-add-btn" onclick={(e) => openAddMenu(e, 'directory', item.id)} title="Add to directory">+</button>
                  <button type="button" class="action-btn delete-btn" onclick={() => { confirmDelete = { type: 'function', functionId: item.id, name: item.name }; }} title="Delete directory" aria-label="Delete directory">&times;</button>
                </div>

                {#if !item.collapsed}
                  <div class="tree-children">
                    {@render functionItems(item.children || [], depth + 1)}
                  </div>
                {/if}
              </div>
            {:else}
              <div
                class="tree-row function-row"
                class:selected={project.selectedFunctionId === item.id}
                style="padding-left: {2.1 + depth * 1.0}rem"
              >
                <span class="arrow-spacer"></span>
                {#if renamingId === item.id}
                  <input
                    class="rename-input"
                    bind:this={renameInput}
                    bind:value={renameValue}
                    onblur={() => commitRename('function', item.id)}
                    onkeydown={(e) => onRenameKeydown(e, 'function', item.id)}
                  />
                {:else}
                  <button
                    type="button"
                    class="name-btn function-name"
                    onclick={() => selectFunction(item.id)}
                    ondblclick={() => startRename(item.id, item.name)}
                  >{item.name}</button>
                {/if}

                <button type="button" class="action-btn delete-btn" onclick={() => { confirmDelete = { type: 'function', functionId: item.id, name: item.name }; }} title="Delete function" aria-label="Delete function">&times;</button>
              </div>
            {/if}
          {/each}
        {/snippet}

        {@render functionItems(project.functions, 0)}
      {/if}
    </div>
  </div>
</div>

{#if addMenu}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="add-dropdown-backdrop" onclick={closeAddMenu} onkeydown={(e) => e.key === 'Escape' && closeAddMenu()}></div>
  <div class="add-dropdown" style="left: {addMenu.x}px; top: {addMenu.y}px">
    {#each addMenuItems[addMenu.type] as item}
      <button type="button" class="add-dropdown-item" onclick={() => addMenuSelect(item.action)}>{item.label}</button>
    {/each}
  </div>
{/if}

{#if confirmDelete}
  <ConfirmDialog
    message={`Delete ${confirmDelete.type} "${confirmDelete.name}"? This cannot be undone.`}
    confirmLabel="Delete"
    onConfirm={() => {
      if (confirmDelete.type === 'actor') removeActor(confirmDelete.actorId);
      else if (confirmDelete.type === 'service') removeService(confirmDelete.actorId, confirmDelete.serviceId);
      else if (confirmDelete.type === 'function') removeFunction(confirmDelete.functionId);
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
    background: #eaeaea;
    margin-top: 0.15rem;
  }

  .project-section-row:hover {
    background: #e0e0e0;
  }

  /* ── Actor / Section / Service rows ─────────────────────── */

  .actor-row {
    padding-left: 1.85rem;
  }

  .subsection-row {
    padding-left: 3.1rem;
  }

  .subsection-label {
    font-size: inherit;
    font-weight: 500;
    color: inherit;
    flex: 1;
  }

  .service-row {
    padding-left: 3.85rem;
  }

  .service-row:hover:not(.selected),
  .function-row:hover:not(.selected),
  .directory-row:hover {
    background: #eee;
  }

  .function-row {
    padding-left: 2.1rem;
  }

  .directory-row {
    padding-left: 2.1rem;
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

  .arrow-spacer {
    width: 18px;
    flex-shrink: 0;
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

  .service-name,
  .function-name {
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

  /* ── Section add button ───────────────────────────────── */

  .section-toggle {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    padding: 0;
    flex: 1;
    min-width: 0;
  }

  .section-add-btn {
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

  .tree-row:hover .section-add-btn {
    color: #007aff;
  }

  .tree-row:hover .section-add-btn:hover {
    background: rgba(0, 122, 255, 0.08);
  }

  /* ── Add dropdown ────────────────────────────────────── */

  .add-dropdown-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .add-dropdown {
    position: fixed;
    z-index: 100;
    background: white;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    padding: 0.25rem 0;
    min-width: 120px;
  }

  .add-dropdown-item {
    display: block;
    width: 100%;
    padding: 0.35rem 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    color: #333;
    text-align: left;
  }

  .add-dropdown-item:hover {
    background: #f0f0f0;
  }

  /* ── Children indentation ──────────────────────────────── */

  .tree-children {
    display: flex;
    flex-direction: column;
  }
</style>
