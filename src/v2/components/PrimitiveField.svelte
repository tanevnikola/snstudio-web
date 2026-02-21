<script>
  import StringValue from './value/primitive/StringValue.svelte';
  import NumberValue from './value/primitive/NumberValue.svelte';
  import BooleanValue from './value/primitive/BooleanValue.svelte';

  let { parameterSpec } = $props();

  const BOOLEAN_TYPES = ['Boolean', 'boolean'];
  const NUMBER_TYPES = ['Integer', 'int', 'Long', 'long', 'Double', 'double', 'Float', 'float', 'Byte', 'byte', 'Short', 'short'];
</script>

{#if BOOLEAN_TYPES.includes(parameterSpec.mnemonic)}
  <BooleanValue label={parameterSpec.name} />
{:else if NUMBER_TYPES.includes(parameterSpec.mnemonic)}
  <NumberValue />
{:else}
  <StringValue />
{/if}
