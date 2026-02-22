<script>
  import yaml from 'js-yaml';
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';

  let { yaml: yamlText = '' } = $props();

  let parsed = $derived.by(() => {
    try {
      const obj = yaml.load(yamlText);
      if (obj && obj.t === 'DomainFunction') return obj;
    } catch {}
    return null;
  });
</script>

{#if parsed}
  <DomainFunctionBlock yaml={parsed} />
{/if}
