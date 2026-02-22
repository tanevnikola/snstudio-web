<script>
  import { getSpecSync } from '../../../lib/specApi.js';
  import StringValue from './value/primitive/StringValue.svelte';
  import NumberValue from './value/primitive/NumberValue.svelte';
  import BooleanValue from './value/primitive/BooleanValue.svelte';
  import EnumValue from './value/primitive/EnumValue.svelte';
  import MnemonicValue from './value/MnemonicValue.svelte';
  import MapField from './MapField.svelte';
  import CollectionField from './CollectionField.svelte';

  let { yaml, parameterSpec } = $props();

  const PRIMITIVE_MNEMONICS = [
    'String', 'Boolean', 'boolean', 'Integer', 'int', 'Long', 'long',
    'Double', 'double', 'Float', 'float', 'Character', 'char',
    'Byte', 'byte', 'Short', 'short',
  ];
  const BOOLEAN_TYPES = ['Boolean', 'boolean'];
  const NUMBER_TYPES = ['Integer', 'int', 'Long', 'long', 'Double', 'double', 'Float', 'float', 'Byte', 'byte', 'Short', 'short'];

  let mnemonic = $derived(parameterSpec?.mnemonic ?? null);

  let isPrimitive = $derived(
    PRIMITIVE_MNEMONICS.includes(mnemonic) || getSpecSync(mnemonic)?.category === 'ENUM'
  );

  let isEnum = $derived(getSpecSync(mnemonic)?.category === 'ENUM');

  let enumValues = $derived(getSpecSync(mnemonic)?.constraints?.values ?? []);
</script>

<div class="field">
  <label class="label">
    {parameterSpec.name}
    {#if parameterSpec.required}<span class="required">*</span>{/if}
  </label>

  <div class="value">
    {#if parameterSpec.injectionStrategy === 'MAP'}
      <MapField yaml={yaml.v} parameterSpec={parameterSpec} />
    {:else if parameterSpec.injectionStrategy === 'COLLECTION'}
      <CollectionField yaml={yaml.v} parameterSpec={parameterSpec} />
    {:else if isPrimitive}
      {#if isEnum}
        <EnumValue yaml={yaml.v} options={enumValues} parameterSpec={parameterSpec} />
      {:else if BOOLEAN_TYPES.includes(mnemonic)}
        <BooleanValue yaml={yaml.v} parameterSpec={parameterSpec} />
      {:else if NUMBER_TYPES.includes(mnemonic)}
        <NumberValue yaml={yaml.v} parameterSpec={parameterSpec} />
      {:else}
        <StringValue yaml={yaml.v} parameterSpec={parameterSpec} />
      {/if}
    {:else}
      <MnemonicValue yaml={yaml.v} parameterSpec={parameterSpec} />
    {/if}
  </div>
</div>

<style>
  .field {
    margin-bottom: 8px;
    width: 100%;
  }
  .label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #555;
    margin-bottom: 2px;
  }
  .required {
    color: #e53935;
    margin-left: 2px;
  }
  .value {
    display: flex;
    align-items: flex-start;
  }
  .value > :global(*) {
    flex: 1;
    min-width: 0;
  }
</style>
