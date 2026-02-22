<script>
  import { getContext } from 'svelte';
  import { fetchSpec } from '../../../lib/specApi.js';
  import ParameterField from './ParameterField.svelte';

  const selection = getContext('selection');
  let yaml = $derived(selection.yaml);

  let mnemonic = $derived(yaml?.tasks ? 'Task.Chain' : yaml?.task?.t ?? null);
  let taskYaml = $derived(yaml?.task ?? (yaml?.tasks ? { t: 'Task.Chain', v: yaml.tasks } : null));
  let spec = $state(null);

  $effect(() => {
    const m = mnemonic;
    if (!m) { spec = null; return; }
    fetchSpec(m).then(s => {
      if (mnemonic === m) spec = s;
    }).catch(() => {
      if (mnemonic === m) spec = null;
    });
  });

  let params = $derived.by(() => {
    if (!spec?.parameters) return [];
    return Object.entries(spec.parameters)
      .filter(([, p]) => p.mnemonic !== 'DomainFunction')
      .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
      .map(([name, p]) => ({ name, ...p }));
  });
</script>

{#if mnemonic}
  {#each params as param (param.name)}
    <ParameterField yaml={taskYaml} parameterSpec={param} />
  {/each}
{/if}
