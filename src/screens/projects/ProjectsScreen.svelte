<script>
  import { projectsList, addProject, removeProject, renameProject } from '../../lib/projectsStore.svelte.js';

  let { onOpenProject } = $props();

  // Inline rename state
  let renamingId = $state(null);
  let renameValue = $state('');
  let renameInput = $state(null);

  function startRename(id, currentName) {
    renamingId = id;
    renameValue = currentName;
    setTimeout(() => renameInput?.focus(), 0);
  }

  function commitRename(projectId) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      renameProject(projectId, trimmed);
    }
    renamingId = null;
  }

  function onRenameKeydown(e, projectId) {
    if (e.key === 'Enter') commitRename(projectId);
    else if (e.key === 'Escape') renamingId = null;
  }

  function handleAddProject() {
    const project = addProject();
    startRename(project.id, project.name);
  }
</script>

<div class="projects-screen">
  {#if projectsList.projects.length === 0}
    <div class="empty-state">
      <span class="empty-text">No projects yet</span>
      <button type="button" class="create-btn" onclick={handleAddProject}>+ Create a Project</button>
    </div>
  {:else}
    <div class="projects-content">
      <div class="projects-header">
        <h2 class="projects-title">Projects</h2>
        <button type="button" class="add-btn" onclick={handleAddProject}>+ New Project</button>
      </div>

      <div class="projects-list">
        {#each projectsList.projects as project (project.id)}
          <div class="project-row" onclick={() => { if (renamingId !== project.id) onOpenProject(project.id); }}>
            {#if renamingId === project.id}
              <input
                class="rename-input"
                bind:this={renameInput}
                bind:value={renameValue}
                onclick={(e) => e.stopPropagation()}
                onblur={() => commitRename(project.id)}
                onkeydown={(e) => onRenameKeydown(e, project.id)}
              />
            {:else}
              <span
                class="project-name"
                ondblclick={(e) => { e.stopPropagation(); startRename(project.id, project.name); }}
              >{project.name}</span>
            {/if}

            <button
              type="button"
              class="delete-btn"
              onclick={(e) => { e.stopPropagation(); removeProject(project.id); }}
              title="Delete project"
              aria-label="Delete project"
            >&times;</button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .projects-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding: 2rem;
    overflow-y: auto;
  }

  /* ── Empty state ──────────────────────────────────────── */

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex: 1;
  }

  .empty-text {
    font-size: 0.9rem;
    color: #bbb;
  }

  .create-btn {
    background: #007aff;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.2rem;
    font-size: 0.85rem;
    font-family: inherit;
    color: white;
    cursor: pointer;
    transition: background 0.15s;
  }

  .create-btn:hover {
    background: #0066d6;
  }

  /* ── Content ──────────────────────────────────────────── */

  .projects-content {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .projects-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .projects-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #222;
  }

  .add-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    color: #007aff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .add-btn:hover {
    background: rgba(0, 122, 255, 0.08);
  }

  /* ── Project rows ─────────────────────────────────────── */

  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .project-row {
    display: flex;
    align-items: center;
    padding: 0.6rem 0.75rem;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
    gap: 0.5rem;
  }

  .project-row:hover {
    background: #f8f8f8;
    border-color: #d0d0d0;
  }

  .project-name {
    flex: 1;
    font-size: 0.88rem;
    font-weight: 500;
    color: #222;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rename-input {
    flex: 1;
    min-width: 0;
    padding: 0.15rem 0.3rem;
    border: 1px solid #007aff;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 500;
    outline: none;
    background: white;
    color: #222;
  }

  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: transparent;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1;
    flex-shrink: 0;
    transition: color 0.1s, background 0.1s;
  }

  .project-row:hover .delete-btn {
    color: #bbb;
  }

  .project-row:hover .delete-btn:hover {
    color: #d32f2f;
    background: rgba(211, 47, 47, 0.08);
  }
</style>
