<script>
  import { getSpecSync } from '../../../lib/specApi.js';
  import ParameterField from '../ParameterField.svelte';

  let { mnemonic } = $props();

  let spec = $derived(getSpecSync(mnemonic));
  let params = $derived(
    spec?.parameters
      ? Object.values(spec.parameters)
          .filter((p) => !p.injectionPoint)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : []
  );
</script>

{#each params as param (param.name)}
  <ParameterField parameterSpec={param} />
{/each}
