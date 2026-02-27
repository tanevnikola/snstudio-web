<script>
  import { renameFunction, removeFunction, getFunctionYaml, updateFunctionYaml, getAllFunctions, getAllDirectories, moveFunction, getParentDirId } from '../../lib/projectStore.svelte.js';
  import FunctionBuilderScreen from '../../v2/screens/FunctionBuilderScreen.svelte';
  import ConfirmDialog from '../../lib/components/ConfirmDialog.svelte';

  let { functionId } = $props();

  let fn = $derived(getAllFunctions().find(f => f.id === functionId));
  let yaml = $derived(getFunctionYaml(functionId));
  let showConfirm = $state(false);
  let directories = $derived(getAllDirectories());
  let currentDirId = $derived(getParentDirId(functionId));

  function onNameInput(e) {
    renameFunction(functionId, e.target.value);
  }

  function onDirectoryChange(e) {
    moveFunction(functionId, e.target.value || null);
  }

  function onYamlChange(newYaml) {
    updateFunctionYaml(functionId, newYaml);
  }
</script>

{#if fn}
  <div class="function-detail">
    <div class="function-header">
      <label class="field name-field">
        <span class="field-label">Name</span>
        <input class="field-input" type="text" value={fn.name} oninput={onNameInput} />
      </label>
      <label class="field dir-field">
        <span class="field-label">Directory</span>
        <select class="field-select" value={currentDirId ?? ''} onchange={onDirectoryChange}>
          <option value="">/ (root)</option>
          {#each directories as dir (dir.id)}
            <option value={dir.id}>{dir.path}</option>
          {/each}
        </select>
      </label>
      <button type="button" class="delete-btn" onclick={() => { showConfirm = true; }}>Delete</button>
    </div>

    <div class="fb-section">
      <span class="section-label">Function Builder</span>
      <div class="fb-container">
        {#key functionId}
          <FunctionBuilderScreen {yaml} />
        {/key}
      </div>
    </div>
  </div>
{/if}

{#if showConfirm && fn}
  <ConfirmDialog
    message={`Delete function "${fn.name}"? This cannot be undone.`}
    confirmLabel="Delete"
    onConfirm={() => { removeFunction(functionId); showConfirm = false; }}
    onCancel={() => { showConfirm = false; }}
  />
{/if}

<style>
  .function-detail {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .function-header {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    padding: 1.5rem 2rem 0.75rem;
    flex-shrink: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
  }

  .name-field {
    flex: 1;
  }

  .dir-field {
    flex: 0 0 auto;
    min-width: 8rem;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-input {
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

  .field-select {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    color: var(--text-primary);
    background: var(--surface-2);
  }

  .fb-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0 2rem 0.4rem;
    flex-shrink: 0;
  }

  .fb-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .delete-btn {
    background: none;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
    font-family: inherit;
    color: var(--danger);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .delete-btn:hover {
    background: var(--danger-subtle);
    border-color: var(--danger);
  }
</style>
