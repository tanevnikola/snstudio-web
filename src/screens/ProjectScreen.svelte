<script>
  import ActorTree from '../components/project/ActorTree.svelte';
  import FunctionTree from '../components/project/FunctionTree.svelte';
  import FunctionBuilderScreen from './FunctionBuilderScreen.svelte';
  import { selection, project, selectProjectFunction, selectActor } from '../lib/store/projectStore.svelte.js';
  import { screenGuard, clearGuard } from '../lib/store/screenGuard.svelte.js';
  import jsYaml from 'js-yaml';

  let { tag } = $props();

  let selectedFn = $derived(
    selection.functionScope === 'project' && selection.functionName
      ? project.functions[selection.functionName]
      : null
  );

  let fnYaml = $derived(
    selectedFn?.yaml ? jsYaml.dump(selectedFn.yaml) : ''
  );

  // ── Unsaved-changes guard ──────────────────────────────────

  let pendingAction = $state(null); // { type: 'function' | 'actor', name: string }
  let showDirtyDialog = $state(false);

  function guardedSelectFunction(name) {
    if (screenGuard.isDirty) {
      pendingAction = { type: 'function', name };
      showDirtyDialog = true;
    } else {
      selectProjectFunction(name);
    }
  }

  function guardedSelectActor(name) {
    if (screenGuard.isDirty) {
      pendingAction = { type: 'actor', name };
      showDirtyDialog = true;
    } else {
      selectActor(name);
    }
  }

  function commitPending() {
    if (!pendingAction) return;
    if (pendingAction.type === 'function') selectProjectFunction(pendingAction.name);
    else selectActor(pendingAction.name);
    pendingAction = null;
    showDirtyDialog = false;
    clearGuard();
  }

  async function saveAndContinue() {
    if (screenGuard.save) await screenGuard.save();
    commitPending();
  }

  function discardAndContinue() {
    commitPending();
  }

  function cancelNavigation() {
    pendingAction = null;
    showDirtyDialog = false;
  }
</script>

<div class="project-screen">
  <aside class="tree-panel">
    <ActorTree onselect={guardedSelectActor} />
    <FunctionTree onselect={guardedSelectFunction} />
  </aside>

  <main class="detail-panel" class:no-padding={!!selectedFn}>
    {#if selectedFn}
      {#key selection.functionName}
        <FunctionBuilderScreen yaml={fnYaml} />
      {/key}
    {:else}
      <div class="empty-state">
        <span class="empty-text">Select an actor or function</span>
      </div>
    {/if}
  </main>

  {#if showDirtyDialog}
    <div class="dirty-overlay" role="dialog" aria-modal="true">
      <div class="dirty-dialog">
        <p class="dirty-message">You have unsaved changes.</p>
        <div class="dirty-actions">
          <button class="btn-save" onclick={saveAndContinue}>Save &amp; continue</button>
          <button class="btn-discard" onclick={discardAndContinue}>Discard &amp; continue</button>
          <button class="btn-cancel" onclick={cancelNavigation}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .project-screen {
    display: flex;
    height: 100%;
    position: relative;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.82rem;
    user-select: none;
  }

  /* ── Tree panel ──────────────────────────────────────────── */

  .tree-panel {
    width: 210px;
    min-width: 150px;
    flex-shrink: 0;
    background: var(--surface-2);
    border-right: 1px solid var(--border-default);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 0.4rem 0;
    gap: 0.5rem;
  }

  /* ── Detail panel ────────────────────────────────────────── */

  .detail-panel {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    background: var(--surface-1);
  }

  .detail-panel.no-padding {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-text {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  /* ── Dirty-state dialog ──────────────────────────────────── */

  .dirty-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dirty-dialog {
    background: var(--surface-2);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 280px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }

  .dirty-message {
    margin: 0;
    font-size: 0.88rem;
    color: var(--text-primary);
  }

  .dirty-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .dirty-actions button {
    padding: 0.3rem 0.75rem;
    border-radius: 5px;
    border: none;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  .btn-save {
    background: var(--primary);
    color: white;
  }

  .btn-save:hover {
    opacity: 0.88;
  }

  .btn-discard {
    background: var(--surface-3);
    color: var(--text-primary);
  }

  .btn-discard:hover {
    background: var(--surface-0);
  }

  .btn-cancel {
    background: transparent;
    color: var(--text-muted);
  }

  .btn-cancel:hover {
    color: var(--text-primary);
  }
</style>
