<script>
  import { getSelectionYaml, setSelectionYaml } from './selectionState.svelte.js';
  import ObjectProperties from '../property/ObjectProperties.svelte';
  import { extractTaskMnemonic, extractTaskYaml } from '../../yamlUtils.js';
  import { flush } from './dragState.js';

  let functionYaml = $derived(getSelectionYaml());
  let taskYaml = $derived(extractTaskYaml(functionYaml));
  let mnemonic = $derived(extractTaskMnemonic(taskYaml));
  function onchange(updatedTaskYaml) {
    const sel = getSelectionYaml();
    const task = sel.task ?? sel;
    if (JSON.stringify(task) === JSON.stringify(updatedTaskYaml)) return;
    // Mutate in-place so flush() sees the changes on the parsed tree
    Object.keys(task).forEach(k => { if (!(k in updatedTaskYaml)) delete task[k]; });
    Object.assign(task, updatedTaskYaml);
    setSelectionYaml({...sel});
    flush();
  }
</script>

{#if mnemonic}
  <div class="header">
    <span class="mnemonic">{mnemonic}</span>
  </div>
  {#key functionYaml}
    <ObjectProperties yaml={taskYaml} onchange={onchange} />
  {/key}
{/if}

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-default);
    margin-bottom: 8px;
  }
  .mnemonic {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
</style>
