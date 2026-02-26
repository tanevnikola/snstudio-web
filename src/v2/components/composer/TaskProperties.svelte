<script>
  import { getSelectionYaml, setSelectionYaml } from './selectionState.svelte.js';
  import ObjectProperties from '../property/ObjectProperties.svelte';
  import YamlContainer from '../yaml/YamlContainer.svelte';
  import { dumpYamlAsText, extractTaskMnemonic, extractTaskYaml } from '../../yamlUtils.js';
  import { flush } from './dragState.js';

  let functionYaml = $derived(getSelectionYaml());
  let taskYaml = $derived(extractTaskYaml(functionYaml));
  let mnemonic = $derived(extractTaskMnemonic(taskYaml));
  let taskYamlText = $derived(dumpYamlAsText(taskYaml));

  function onchange(updatedTaskYaml) {
    const sel = getSelectionYaml();
    if (JSON.stringify(sel.task) === JSON.stringify(updatedTaskYaml)) return;
    setSelectionYaml({ ...sel, task: updatedTaskYaml });
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
  <YamlContainer
    yamlText={taskYamlText}
    collapsed={true}
    canEdit={false}
    style="max-height: 450px"
  />
{/if}

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 8px;
  }
  .mnemonic {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
</style>
