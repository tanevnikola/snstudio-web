<script>
  import { projectsList, addProject, removeProject, setProjectTag } from '../lib/store/projectsStore.svelte.js';
  import ConfirmDeleteButton from '../components/ConfirmDeleteButton.svelte';

  let { onopen = () => {} } = $props();

  let renamingTag = $state(null);
  let renameValue = $state('');
  let renameInput = $state(null);

  function startRename(tag) {
    renamingTag = tag;
    renameValue = tag;
    setTimeout(() => renameInput?.focus(), 0);
  }

  async function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== renamingTag) {
      await setProjectTag(renamingTag, trimmed);
    }
    renamingTag = null;
  }

  function onRenameKeydown(e) {
    if (e.key === 'Enter') commitRename();
    else if (e.key === 'Escape') renamingTag = null;
  }

  async function handleAdd() {
    let tag = 'untitled';
    let n = 2;
    while (projectsList.projects.some(p => p.tag === tag)) tag = `untitled-${n++}`;
    await addProject(tag);
    startRename(tag);
  }
</script>

<div class="home-screen">
  {#if projectsList.projects.length === 0}
    <div class="empty-state">
      <span class="empty-text">No projects yet</span>
      <button type="button" class="create-btn" onclick={handleAdd}>+ Create a project</button>
    </div>
  {:else}
    <div class="content">
      <div class="header">
        <h2 class="title">Projects</h2>
        <button type="button" class="add-btn" onclick={handleAdd}>+ New</button>
      </div>

      <div class="list">
        {#each projectsList.projects as project (project.tag)}
          <div
            class="row"
            onclick={() => { if (renamingTag !== project.tag) onopen(project.tag); }}
          >
            {#if renamingTag === project.tag}
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
                class="tag"
                ondblclick={(e) => { e.stopPropagation(); startRename(project.tag); }}
              >{project.tag}</span>
            {/if}

            <div class="row-actions" onclick={(e) => e.stopPropagation()}>
              <ConfirmDeleteButton onclick={() => removeProject(project.tag)} />
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .home-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding: 2rem;
    overflow-y: auto;
    background: var(--surface-0);
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
    color: var(--text-muted);
  }

  .create-btn {
    background: var(--primary);
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1.2rem;
    font-size: 0.85rem;
    font-family: inherit;
    color: white;
    cursor: pointer;
    transition: background 0.15s;
  }

  .create-btn:hover { background: var(--primary-hover); }

  /* ── Content ──────────────────────────────────────────── */

  .content {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .add-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    color: var(--primary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .add-btn:hover { background: var(--primary-subtle); }

  /* ── Rows ─────────────────────────────────────────────── */

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .row {
    display: flex;
    align-items: center;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    background: var(--surface-2);
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
    gap: 0.5rem;
  }

  .row:hover {
    background: var(--surface-3);
    border-color: var(--border-strong);
  }

  .tag {
    flex: 1;
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--text-primary);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rename-input {
    flex: 1;
    min-width: 0;
    padding: 0.15rem 0.3rem;
    border: 1px solid var(--primary);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 500;
    outline: none;
    background: var(--surface-1);
    color: var(--text-primary);
  }

  .row-actions {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.1s;
  }

  .row:hover .row-actions { opacity: 1; }
</style>
