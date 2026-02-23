<script>
  import { getSpecSync, isImplementingSync } from '../../../lib/specApi.js';
  import { markDirty } from '../composer/selectionState.svelte.js';
  import StringValue from './value/primitive/StringValue.svelte';
  import NumberValue from './value/primitive/NumberValue.svelte';
  import BooleanValue from './value/primitive/BooleanValue.svelte';
  import EnumValue from './value/primitive/EnumValue.svelte';
  import InjectedValue from './value/InjectedValue.svelte';
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
  let canInject = $derived(parameterSpec?.eager === false && parameterSpec?.injectionPoint === true);

  let isDelegating = $derived(parameterSpec?.name === '@delegating@');
  let currentValue = $derived(isDelegating ? yaml?.v : yaml?.v?.[parameterSpec?.name]);
  let currentType = $derived(currentValue?.t ?? null);
  let hasInjector = $derived(currentType ? isImplementingSync(currentType, 'ResourceInjector') : false);

  let injecting = $state(false);

  $effect(() => {
    if (hasInjector) injecting = true;
  });

  let isPrimitive = $derived(
    PRIMITIVE_MNEMONICS.includes(mnemonic) || getSpecSync(mnemonic)?.category === 'ENUM'
  );

  let isEnum = $derived(getSpecSync(mnemonic)?.category === 'ENUM');
  let enumValues = $derived(getSpecSync(mnemonic)?.constraints?.values ?? []);

  function ensureV() {
    if (!yaml.v) yaml.v = {};
    return yaml.v;
  }

  function handlePrimitiveChange(newValue) {
    ensureV()[parameterSpec.name] = newValue;
    markDirty();
  }

  function handleNumberChange(newValue) {
    const num = Number(newValue);
    ensureV()[parameterSpec.name] = newValue === '' ? '' : isNaN(num) ? newValue : num;
    markDirty();
  }
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
    {:else}
      {#if canInject}
        <button class="inject-toggle" class:active={injecting} onclick={() => (injecting = !injecting)} title="Use resource injector">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
        </button>
      {/if}

      {#if injecting}
        <InjectedValue {yaml} {parameterSpec} />
      {:else if isPrimitive}
        {#if isEnum}
          <EnumValue value={yaml?.v?.[parameterSpec.name] ?? ''} options={enumValues} onchange={handlePrimitiveChange} />
        {:else if BOOLEAN_TYPES.includes(mnemonic)}
          <BooleanValue value={yaml?.v?.[parameterSpec.name] ?? false} onchange={handlePrimitiveChange} />
        {:else if NUMBER_TYPES.includes(mnemonic)}
          <NumberValue value={yaml?.v?.[parameterSpec.name] ?? ''} onchange={handleNumberChange} />
        {:else}
          <StringValue value={yaml?.v?.[parameterSpec.name] ?? ''} onchange={handlePrimitiveChange} />
        {/if}
      {:else}
        <MnemonicValue yaml={yaml?.v?.[parameterSpec.name] ?? ''} mnemonic={ parameterSpec.mnemonic } />
      {/if}
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
  .inject-toggle {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    color: #999;
    cursor: pointer;
    margin-right: 4px;
  }
  .inject-toggle:hover {
    color: #666;
    border-color: #999;
  }
  .inject-toggle.active {
    background: #fff3e0;
    border-color: #ff9800;
    color: #ff9800;
  }
</style>
