<script>
  import jsYaml from 'js-yaml';
  import { fetchSpec, getNonDomainFunctionParameters } from '../../mnemoUtils.js';
  import { getSelectionYaml, setSelectionYaml } from '../composer/selectionState.svelte.js';
  import ParameterField from './ParameterField.svelte';
  import YamlContainer from '../YamlContainer.svelte';
  import { dumpYamlAsText, extractParameterYaml, extractTaskMnemonic, extractTaskYaml } from '../../yamlUtils.js';
  import { flush } from '../composer/dragState.js';

  let functionYaml = $derived(getSelectionYaml());

  let taskYaml = $derived(extractTaskYaml(functionYaml));
  let mnemonic = $derived(extractTaskMnemonic(taskYaml));

  let mnemonicSpec = $state(null);
  let specForMnemonic = $state(null);

  // load mnemonicSpec
  $effect(() => {
    const m = mnemonic;
    if (!m) { mnemonicSpec = null; specForMnemonic = null; return; }
    fetchSpec(m).then(s => {
      if (mnemonic === m) { mnemonicSpec = s; specForMnemonic = m; }
    }).catch(() => {
      if (mnemonic === m) { mnemonicSpec = null; specForMnemonic = m; }
    });
  });

  let parameters = $derived.by(() => {
    if (specForMnemonic !== mnemonic) return [];
    return getNonDomainFunctionParameters(mnemonicSpec);
  });
  let taskYamlText = $derived(dumpYamlAsText(taskYaml));

  function onParamChange(paramName, paramYaml) {
    const sel = getSelectionYaml();
    const updated = { ...sel };
    if (paramName == '@delegating@') {
      if (JSON.stringify(updated.task.v) === JSON.stringify(paramYaml)) return;
      updated.task.v = paramYaml;
    } else {
      if (JSON.stringify(updated.task.v[paramName]) === JSON.stringify(paramYaml)) return;
      updated.task.v[paramName] = paramYaml;
    }
    console.log("sel", $state.snapshot(sel))
    console.log("updated", $state.snapshot(updated))


    setSelectionYaml(updated);
    flush();
  }

</script>

{#if mnemonic}
  <div class="header">
    <span class="mnemonic">{mnemonic}</span>
  </div>
  {#key functionYaml}
    <div class="params">
      {#each parameters as param (param.name)}
        <ParameterField
          parameterYaml={extractParameterYaml(taskYaml.v, param)}
          parameterSpec={param}
          onchange={(paramYaml) => onParamChange(param.name, paramYaml)}
        />
      {/each}
    </div>
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
  .params {
    padding: 8px 12px;
  }
</style>
