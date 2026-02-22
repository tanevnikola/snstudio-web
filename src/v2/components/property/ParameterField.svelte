<script>
  import { fetchSpec, getSpecSync } from '../../../lib/specApi.js';
  import StringValue from './value/primitive/StringValue.svelte';
  import NumberValue from './value/primitive/NumberValue.svelte';
  import BooleanValue from './value/primitive/BooleanValue.svelte';
  import EnumValue from './value/primitive/EnumValue.svelte';
  import MnemonicValue from './value/MnemonicValue.svelte';
  import MapField from './MapField.svelte';
  import CollectionField from './CollectionField.svelte';

  let { yaml, parameterSpec} = $props();

  let mnemonic = $derived(parameterSpec?.mnemonic ?? null);
  let mnemonicSpec = $state(null);

  $effect(() => {
    const m = mnemonic;
    if (!m) { mnemonicSpec = null; return; }
    fetchSpec(m).then(s => {
      if (mnemonic === m) mnemonicSpec = s;
    }).catch(() => {
      if (mnemonic === m) mnemonicSpec = null;
    });
  });

  const PRIMITIVE_MNEMONICS = [
    'String', 'Boolean', 'boolean', 'Integer', 'int', 'Long', 'long',
    'Double', 'double', 'Float', 'float', 'Character', 'char',
    'Byte', 'byte', 'Short', 'short',
  ];
  const BOOLEAN_TYPES = ['Boolean', 'boolean'];
  const NUMBER_TYPES = ['Integer', 'int', 'Long', 'long', 'Double', 'double', 'Float', 'float', 'Byte', 'byte', 'Short', 'short'];

  let params = $derived.by(() => {
    if (!parameterSpec?.parameters) return [];
    return Object.entries(parameterSpec.parameters)
      .filter(([, p]) => p.mnemonic !== 'DomainFunction')
      .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
      .map(([name, p]) => ({ name, ...p }));
  });

  function isPrimitive(param) {
    return PRIMITIVE_MNEMONICS.includes(param.mnemonic) || getSpecSync(param.mnemonic)?.category === 'ENUM';
  }

  function isEnum(param) {
    return getSpecSync(param.mnemonic)?.category === 'ENUM';
  }

  function getEnumValues(param) {
    return getSpecSync(param.mnemonic)?.constraints?.values ?? [];
  }

  $effect(() => {
    console.log("yaml", yaml, "mnemonic", mnemonic, "name", parameterSpec.name);
  });
</script>

{#if mnemonicSpec && params.length > 0}
  {#each params as param (param.name)}
    <div class="field">
      <label class="label">
        {param.name}
        {#if param.required}<span class="required">*</span>{/if}
      </label>
      
      <div class="value">
        {#if param.injectionStrategy === 'MAP'}
          <MapField yaml={yaml.v} parameterSpec={param} />
        {:else if param.injectionStrategy === 'COLLECTION'}
          <CollectionField yaml={yaml.v} parameterSpec={param} />
        {:else if isPrimitive(param)}
          {#if isEnum(param)}
            <EnumValue yaml={yaml.v} options={getEnumValues(param)} parameterSpec={param} />
          {:else if BOOLEAN_TYPES.includes(param.mnemonic)}
            <BooleanValue yaml={yaml.v} parameterSpec={param} />
          {:else if NUMBER_TYPES.includes(param.mnemonic)}
            <NumberValue yaml={yaml.v} parameterSpec={param} />
          {:else}
            <StringValue yaml={yaml.v} parameterSpec={param} />
          {/if}
        {:else}
          <MnemonicValue yaml={yaml.v} parameterSpec={param} />
        {/if}
      </div>
    </div>
  {/each}
{/if}

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
