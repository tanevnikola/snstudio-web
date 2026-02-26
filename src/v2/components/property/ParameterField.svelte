<script>
  import { isMapInjection, isCollectionInjection, isDelegating, isInjectionAllowed } from '../../parameterSpecUtils.js';
  import { getSpec, isImplementing, isPrimitive, isStringPrimitive, isBooleanPrimitive, isNumberPrimitive, isEnumPrimitive } from '../../mnemoUtils.js';
  import MapValue from './value/MapValue.svelte';
  import CollectionValue from './value/CollectionValue.svelte';
  import MnemonicValue from './value/MnemonicValue.svelte';
  import StringValue from './value/StringValue.svelte';
  import NumberValue from './value/NumberValue.svelte';
  import BooleanValue from './value/BooleanValue.svelte';
  import EnumValue from './value/EnumValue.svelte';

  let { parameterYaml, parameterSpec, onchange = () => {} } = $props();

  let mnemonic = $derived(parameterSpec?.mnemonic ?? null);
  let canInject = $derived(isInjectionAllowed(parameterSpec));

  let currentType = $derived(parameterYaml?.t ?? null);
  let isInjectorSet = $derived(currentType ? isImplementing(currentType, 'ResourceInjector') : false);

  let isPrim = $derived(isPrimitive(mnemonic));
  let isEnum = $derived(isEnumPrimitive(mnemonic));
  let enumValues = $derived(getSpec(mnemonic)?.constraints?.values ?? []);

  let injecting = $state(isInjectorSet);
</script>

{#snippet fieldContent()}
  {#if isMapInjection(parameterSpec)}
    <MapValue
      yaml={parameterYaml}
      parameterSpec={parameterSpec}
      onchange={onchange}
    />
  {:else if isCollectionInjection(parameterSpec)}
    <CollectionValue
      yaml={parameterYaml}
      parameterSpec={parameterSpec}
      onchange={onchange}
    />
  {:else}
    <div class="direct-field">
      {#if canInject}
        <button class="inject-toggle" class:active={injecting} onclick={() => (injecting = !injecting)} title="Use resource injector">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
        </button>
      {/if}

      {#if injecting}
        <MnemonicValue yaml={parameterYaml} mnemonic={'ResourceInjector'} onchange={onchange} />
      {:else if isPrim}
        {#if isEnum}
          <EnumValue yaml={parameterYaml} mnemonic={mnemonic} spec={parameterSpec} options={enumValues} onchange={onchange} />
        {:else if isBooleanPrimitive(mnemonic)}
          <BooleanValue yaml={parameterYaml} mnemonic={mnemonic} spec={parameterSpec} onchange={onchange} />
        {:else if isNumberPrimitive(mnemonic)}
          <NumberValue yaml={parameterYaml} mnemonic={mnemonic} spec={parameterSpec} onchange={onchange} />
        {:else if isStringPrimitive(mnemonic)}
          <StringValue yaml={parameterYaml} mnemonic={mnemonic} spec={parameterSpec} onchange={onchange} />
        {:else}
          {console.error(`ParameterField: unhandled primitive category for mnemonic "${mnemonic}"`)}
        {/if}
      {:else}
        <MnemonicValue yaml={parameterYaml} mnemonic={parameterSpec.mnemonic} onchange={onchange} />
      {/if}
    </div>
  {/if}
{/snippet}

{#if isDelegating(parameterSpec)}
  {@render fieldContent()}
{:else}
  <div class="field">
    <span class="label">
      {parameterSpec.name}
      {#if parameterSpec.required}<span class="required">*</span>{/if}
    </span>
    <div class="value">
      {@render fieldContent()}
    </div>
  </div>
{/if}

<style>
  .field {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fafafa;
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
