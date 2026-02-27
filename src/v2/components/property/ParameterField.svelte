<script>
  import { marked } from 'marked';
  import { isMapInjection, isCollectionInjection, isDelegating, isInjectionAllowed } from '../../parameterSpecUtils.js';
  import { getSpec, isImplementing, isPrimitive, isStringPrimitive, isBooleanPrimitive, isNumberPrimitive, isEnumPrimitive } from '../../mnemoUtils.js';
  import MapValue from './MapValue.svelte';
  import CollectionValue from './CollectionValue.svelte';
  import MnemonicValue from './MnemonicValue.svelte';
  import StringValue from './StringValue.svelte';
  import NumberValue from './NumberValue.svelte';
  import BooleanValue from './BooleanValue.svelte';
  import EnumValue from './EnumValue.svelte';

  let { parameterYaml, parameterSpec, onchange = () => {} } = $props();

  let mnemonic = $derived(parameterSpec?.mnemonic ?? null);
  let canInject = $derived(isInjectionAllowed(parameterSpec));

  let currentType = $derived(parameterYaml?.t ?? null);
  let isInjectorSet = $derived(currentType ? isImplementing(currentType, 'ResourceInjector') : false);

  let isPrim = $derived(isPrimitive(mnemonic));
  let isEnum = $derived(isEnumPrimitive(mnemonic));
  let enumValues = $derived(getSpec(mnemonic)?.constraints?.values ?? []);

  let injecting = $state(isInjectorSet);

  let descriptionHtml = $derived(parameterSpec?.description ? marked.parseInline(parameterSpec.description) : '');
  let showTooltip = $state(false);

  let isMnemonicField = $derived(!isPrim && !isMapInjection(parameterSpec) && !isCollectionInjection(parameterSpec) && !isDelegating(parameterSpec));
  let collapsed = $state(false);
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
    <div class="field-header">
      {#if isMnemonicField}
        <button class="collapse-toggle" onclick={() => collapsed = !collapsed}>
          {collapsed ? '▶' : '▼'}
        </button>
      {/if}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span class="label" onmouseenter={() => showTooltip = true} onmouseleave={() => showTooltip = false}>
        {parameterSpec.name}
        {#if parameterSpec.required}<span class="required">*</span>{/if}
        {#if showTooltip && descriptionHtml}
          <span class="tooltip">{@html descriptionHtml}</span>
        {/if}
      </span>
      <span class="meta">
        ({parameterSpec.mnemonic}{#if parameterSpec.injectionStrategy}, {parameterSpec.injectionStrategy}{/if})
      </span>
    </div>
    {#if !collapsed}
      <div class="value">
        {@render fieldContent()}
      </div>
    {/if}
  </div>
{/if}

<style>
  .field {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    background: var(--surface-2);
    width: 100%;
  }
  .field-header {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 4px;
  }
  .collapse-toggle {
    background: none;
    border: none;
    padding: 0;
    font-size: 8px;
    color: var(--text-muted);
    cursor: pointer;
    line-height: 1;
    flex-shrink: 0;
  }
  .collapse-toggle:hover {
    color: var(--text-secondary);
  }
  .label {
    display: inline;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    position: relative;
    cursor: help;
  }
  .tooltip {
    position: absolute;
    left: 0;
    top: 100%;
    z-index: 100;
    background: var(--surface-0);
    color: var(--text-primary);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 400;
    line-height: 1.5;
    max-width: 320px;
    width: max-content;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    pointer-events: none;
  }
  .tooltip :global(p) { margin: 0.2rem 0; }
  .tooltip :global(code) { background: rgba(255,255,255,0.1); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 10px; }
  .tooltip :global(strong) { color: var(--text-primary); }
  .tooltip :global(a) { color: var(--primary-hover); }
  .required {
    color: var(--danger);
    margin-left: 2px;
  }
  .meta {
    display: block;
    font-size: 10px;
    color: var(--text-muted);
    margin-bottom: 4px;
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
    border: 1px solid var(--border-default);
    border-radius: 4px;
    background: var(--surface-3);
    color: var(--text-muted);
    cursor: pointer;
    margin-right: 4px;
  }
  .inject-toggle:hover {
    color: var(--text-secondary);
    border-color: var(--border-strong);
  }
  .inject-toggle.active {
    background: var(--primary-subtle);
    border-color: var(--primary);
    color: var(--primary);
  }
</style>
