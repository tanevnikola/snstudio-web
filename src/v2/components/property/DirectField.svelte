<script>
  import { getSpec, isImplementing, isPrimitive, isStringPrimitive, isBooleanPrimitive, isNumberPrimitive, isEnumPrimitive } from '../../mnemoUtils.js';
  import { isInjectionAllowed } from '../../parameterSpecUtils.js';
  import StringValue from './value/StringValue.svelte';
  import NumberValue from './value/NumberValue.svelte';
  import BooleanValue from './value/BooleanValue.svelte';
  import EnumValue from './value/EnumValue.svelte';
  import InjectionField from './InjectionField.svelte';
  import MnemonicField from './MnemonicField.svelte';

  let { yaml, parameterSpec, onchange = () => {} } = $props();


  let mnemonic = $derived(parameterSpec?.mnemonic ?? null);
  let canInject = $derived(isInjectionAllowed(parameterSpec));

  let currentType = $derived(yaml?.t ?? null);
  let isInjectorSet = $derived(currentType ? isImplementing(currentType, 'ResourceInjector') : false);

  let isPrim = $derived(isPrimitive(mnemonic));

  let isEnum = $derived(isEnumPrimitive(mnemonic));
  let enumValues = $derived(getSpec(mnemonic)?.constraints?.values ?? []);

  let injecting = $state(false);

  $effect(() => {
    injecting = isInjectorSet;
    console.log(isInjectorSet, injecting, isImplementing(currentType, 'ResourceInjector'))
  });

  function handlePrimitiveChange(newValue) {
    onchange(newValue);
  }

  function handleNumberChange(newValue) {
    const num = Number(newValue);
    onchange(newValue === '' ? '' : isNaN(num) ? newValue : num);
  }

  function handleInjectorChange(newValue) {
    onchange(newValue);
  }
</script>

<div class="direct-field">
  {#if canInject}
    <button class="inject-toggle" class:active={injecting} onclick={() => (injecting = !injecting)} title="Use resource injector">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
    </button>
  {/if}

  {#if injecting}
    <InjectionField yaml={yaml} onchange={handleInjectorChange} />
  {:else if isPrim}
    {#if isEnum}
      <EnumValue value={yaml.v} options={enumValues} onchange={handlePrimitiveChange} />
    {:else if isBooleanPrimitive(mnemonic)}
      <BooleanValue value={yaml.v} onchange={handlePrimitiveChange} />
    {:else if isNumberPrimitive(mnemonic)}
      <NumberValue value={yaml.v} onchange={handleNumberChange} />
    {:else if isStringPrimitive(mnemonic)}
      <StringValue value={yaml.v} onchange={handlePrimitiveChange} />
    {:else}
      {console.error(`DirectField: unhandled primitive category for mnemonic "${mnemonic}"`)}
    {/if}
  {:else}
    <MnemonicField yaml={yaml} mnemonic={ parameterSpec.mnemonic } />
  {/if}
</div>

<style>
  .direct-field {
    display: flex;
    align-items: flex-start;
  }
  .direct-field > :global(*:not(button)) {
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
