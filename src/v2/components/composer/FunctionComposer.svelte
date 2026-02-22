<script>
  import yaml from 'js-yaml';
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';
  import { registerFlush } from './dragState.js';

  let { yaml: yamlText = '', onyamlchange = (/** @type {string} */ _text) => {} } = $props();

  let parsed = $derived.by(() => {
    try {
      const obj = yaml.load(yamlText);
      if (obj && obj.t === 'DomainFunction') return obj;
    } catch {}
    return null;
  });

  registerFlush(() => {
    if (!parsed) return;
    const newText = yaml.dump(parsed, { lineWidth: -1, noRefs: true });
    onyamlchange(newText);
  });
</script>

{#if parsed}
  <DomainFunctionBlock yaml={parsed} />
{/if}
