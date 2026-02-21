<script>
  import { getSpecSync } from '../../lib/specApi.js';
  import StringValue from './value/primitive/StringValue.svelte';
  import NumberValue from './value/primitive/NumberValue.svelte';
  import BooleanValue from './value/primitive/BooleanValue.svelte';
  import EnumValue from './value/primitive/EnumValue.svelte';

  let { parameterSpec } = $props();

  const BOOLEAN_TYPES = ['Boolean', 'boolean'];
  const NUMBER_TYPES = ['Integer', 'int', 'Long', 'long', 'Double', 'double', 'Float', 'float', 'Byte', 'byte', 'Short', 'short'];

  let spec = $derived(getSpecSync(parameterSpec.mnemonic));
  let isEnum = $derived(spec?.category === 'ENUM');
  let enumValues = $derived(spec?.constraints?.values ?? []);
</script>

{#if isEnum}
  <EnumValue options={enumValues} />
{:else if BOOLEAN_TYPES.includes(parameterSpec.mnemonic)}
  <BooleanValue />
{:else if NUMBER_TYPES.includes(parameterSpec.mnemonic)}
  <NumberValue />
{:else}
  <StringValue />
{/if}
