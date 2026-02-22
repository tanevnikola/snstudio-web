<script>
  import { getSpecSync, getConcreteImplementations } from '../../../lib/specApi.js';
  import { markDirty } from '../composer/selectionState.svelte.js';
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
  let canInject = $derived(parameterSpec?.eager === false && parameterSpec?.injectionPoint === true);
  let injecting = $state(false);
  let injectorOptions = $derived(injecting ? getConcreteImplementations('ResourceInjector') : []);

  let isPrimitive = $derived(
    PRIMITIVE_MNEMONICS.includes(mnemonic) || getSpecSync(mnemonic)?.category === 'ENUM'
  );

  let isEnum = $derived(getSpecSync(mnemonic)?.category === 'ENUM');

  let enumValues = $derived(getSpecSync(mnemonic)?.constraints?.values ?? []);

  function handlePrimitiveChange(newValue) {
    yaml.v[parameterSpec.name] = newValue;
    markDirty();
  }

  function handleInjectorChange(e) {
    const selected = e.target.value;
    if (selected) {
      yaml.v[parameterSpec.name] = { t: selected, v: {} };
    } else {
      delete yaml.v[parameterSpec.name];
    }
    markDirty();
  }

  function handleNumberChange(newValue) {
    const num = Number(newValue);
    yaml.v[parameterSpec.name] = newValue === '' ? '' : isNaN(num) ? newValue : num;
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
        <select class="injector-select" onchange={handleInjectorChange} value={yaml.v?.[parameterSpec.name]?.t ?? ''}>
          <option value="">— Select Injector —</option>
          {#each injectorOptions as opt}
            <option value={opt}>{opt}</option>
          {/each}
        </select>
      {:else if isPrimitive}
        {#if isEnum}
          <EnumValue value={yaml.v?.[parameterSpec.name] ?? ''} options={enumValues} onchange={handlePrimitiveChange} />
        {:else if BOOLEAN_TYPES.includes(mnemonic)}
          <BooleanValue value={yaml.v?.[parameterSpec.name] ?? false} onchange={handlePrimitiveChange} />
        {:else if NUMBER_TYPES.includes(mnemonic)}
          <NumberValue value={yaml.v?.[parameterSpec.name] ?? ''} onchange={handleNumberChange} />
        {:else}
          <StringValue value={yaml.v?.[parameterSpec.name] ?? ''} onchange={handlePrimitiveChange} />
        {/if}
      {:else}
        <MnemonicValue yaml={yaml.v?.[parameterSpec.name] ?? ''} parameterSpec={parameterSpec} />
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
  .injector-select {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ff9800;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
    background: #fff8e1;
  }
  .injector-select:focus {
    outline: none;
    border-color: #f57c00;
  }
</style>
