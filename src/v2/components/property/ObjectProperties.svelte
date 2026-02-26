<script>
  import { fetchSpec, getNonDomainFunctionParameters } from '../../mnemoUtils.js';
  import ParameterField from './ParameterField.svelte';
  import { extractParameterYaml } from '../../yamlUtils.js';

  let { yaml, onchange = () => {} } = $props();

  let mnemonic = $derived(yaml?.t ?? null);

  let mnemonicSpec = $state(null);
  let specForMnemonic = $state(null);

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

  function onParamChange(paramName, paramYaml) {
    if (paramName === '@delegating@') {
      onchange({ ...yaml, v: paramYaml });
    } else {
      onchange({ ...yaml, v: { ...yaml.v, [paramName]: paramYaml } });
    }
  }
</script>

{#if mnemonic}
  <div class="params">
    {#each parameters as param (param.name)}
      <ParameterField
        parameterYaml={extractParameterYaml(yaml.v, param)}
        parameterSpec={param}
        onchange={(paramYaml) => onParamChange(param.name, paramYaml)}
      />
    {/each}
  </div>
{/if}

<style>
  .params {
    padding: 8px 12px;
  }
</style>
