<script>
  import { project, renameFunction, removeFunction, getFunctionYaml, updateFunctionYaml } from '../../lib/projectStore.svelte.js';
  import FunctionBuilder from '../function-builder/FunctionBuilder.svelte';
  import ConfirmDialog from '../../lib/components/ConfirmDialog.svelte';

  let { functionId } = $props();

  let fn = $derived(project.functions.find(f => f.id === functionId));
  let yaml = $derived(getFunctionYaml(functionId));
  let showConfirm = $state(false);

  function onNameInput(e) {
    renameFunction(functionId, e.target.value);
  }

  function onYamlChange(newYaml) {
    updateFunctionYaml(functionId, newYaml);
  }
</script>

{#if fn}
  <div class="function-detail">
    <div class="function-header">
      <label class="field">
        <span class="field-label">Name</span>
        <input class="field-input" type="text" value={fn.name} oninput={onNameInput} />
      </label>
      <button type="button" class="delete-btn" onclick={() => { showConfirm = true; }}>Delete</button>
    </div>

    <div class="fb-section">
      <span class="section-label">Function Builder</span>
      <div class="fb-container">
        {#key functionId}
          <FunctionBuilder initialYaml={yaml} {onYamlChange} />
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
    flex: 1;
    min-width: 0;
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
    color: #888;
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
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
    font-family: inherit;
    color: #d32f2f;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .delete-btn:hover {
    background: rgba(211, 47, 47, 0.06);
    border-color: #d32f2f;
  }
</style>
