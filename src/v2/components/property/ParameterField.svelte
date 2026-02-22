<script>
  import { getSpecSync } from '../../../lib/specApi.js';
  import StringValue from './value/primitive/StringValue.svelte';
  import NumberValue from './value/primitive/NumberValue.svelte';
  import BooleanValue from './value/primitive/BooleanValue.svelte';
  import EnumValue from './value/primitive/EnumValue.svelte';
  import MnemonicValue from './value/MnemonicValue.svelte';
  import MapValue from './value/MapValue.svelte';
  import CollectionValue from './value/CollectionValue.svelte';
  import DocsPopover from '../../../lib/components/DocsPopover.svelte';

  let { parameterSpec } = $props();

  const PRIMITIVE_MNEMONICS = [
    'String', 'Boolean', 'boolean', 'Integer', 'int', 'Long', 'long',
    'Double', 'double', 'Float', 'float', 'Character', 'char',
    'Byte', 'byte', 'Short', 'short',
  ];
  const BOOLEAN_TYPES = ['Boolean', 'boolean'];
  const NUMBER_TYPES = ['Integer', 'int', 'Long', 'long', 'Double', 'double', 'Float', 'float', 'Byte', 'byte', 'Short', 'short'];

  let spec = $derived(getSpecSync(parameterSpec.mnemonic));
  let isPrimitive = $derived(
    PRIMITIVE_MNEMONICS.includes(parameterSpec.mnemonic) || spec?.category === 'ENUM'
  );
  let isEnum = $derived(spec?.category === 'ENUM');
  let enumValues = $derived(spec?.constraints?.values ?? []);
  let canBeInjected = $derived(parameterSpec.injectionPoint && !parameterSpec.eager);
  let injecting = $state(false);
  let collapsed = $state(false);
  let showDocs = $state(false);
  let docsPinned = $state(false);
  let docsHoverTimer = null;

  function onDocsEnter() {
    clearTimeout(docsHoverTimer);
    if (!docsPinned) showDocs = true;
  }

  function onDocsLeave() {
    if (!docsPinned) {
      docsHoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }

  function onDocsPopoverEnter() {
    clearTimeout(docsHoverTimer);
  }

  function onDocsPopoverLeave() {
    if (!docsPinned) {
      docsHoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }

  function onDocsClick(e) {
    e.stopPropagation();
    e.preventDefault();
    docsPinned = true;
    showDocs = true;
  }

  function closeDocs() {
    showDocs = false;
    docsPinned = false;
    clearTimeout(docsHoverTimer);
  }

</script>

<div class="field" class:mnemonic={(!isPrimitive || (parameterSpec.injectionStrategy && parameterSpec.injectionStrategy !== 'DIRECT')) && parameterSpec.name}>
  {#if parameterSpec.name}
    <div class="header" role="button" tabindex="-1" onclick={() => collapsed = !collapsed} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') collapsed = !collapsed; }}>
      <span class="collapse-arrow" class:collapsed>{collapsed ? '▶' : '▼'}</span>
      <span class="label">
        {parameterSpec.name}
        {#if parameterSpec.required}<span class="required">*</span>{/if}
        {#if collapsed}<span class="mnemonic-hint">({parameterSpec.injectionStrategy ? parameterSpec.injectionStrategy + ', ' : ''}{spec?.category}, {parameterSpec.mnemonic})</span>{/if}
      </span>
      <span class="info-icon" role="button" tabindex="-1"
        onmouseenter={onDocsEnter}
        onmouseleave={onDocsLeave}
        onclick={onDocsClick}
        onkeydown={onDocsClick}>i</span>
    </div>
  {/if}

  {#if !collapsed}
    {#if parameterSpec.injectionStrategy === 'MAP'}
      <MapValue {parameterSpec} />
    {:else if parameterSpec.injectionStrategy === 'COLLECTION'}
      <CollectionValue {parameterSpec} />
    {:else}
      <div class="body">
        {#if canBeInjected}
          <button class="inject-toggle" class:active={injecting} onclick={() => injecting = !injecting}
            title={injecting ? 'Switch to value' : 'Switch to injection'}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </button>
        {/if}
        {#if injecting}
          <MnemonicValue mnemonic="ResourceInjector" />
        {:else if isPrimitive}
          {#if isEnum}
            <EnumValue options={enumValues} />
          {:else if BOOLEAN_TYPES.includes(parameterSpec.mnemonic)}
            <BooleanValue />
          {:else if NUMBER_TYPES.includes(parameterSpec.mnemonic)}
            <NumberValue />
          {:else}
            <StringValue />
          {/if}
        {:else}
          <MnemonicValue mnemonic={parameterSpec.mnemonic} />
        {/if}
      </div>
    {/if}
  {/if}
</div>

{#if showDocs && parameterSpec.mnemonic}
  <DocsPopover
    url="/docs/autogen.md?target={parameterSpec.mnemonic}"
    title={parameterSpec.mnemonic}
    pinned={docsPinned}
    onclose={closeDocs}
    onmouseenter={onDocsPopoverEnter}
    onmouseleave={onDocsPopoverLeave}
  />
{/if}

<style>
  .field {
    margin-bottom: 8px;
    width: 100%;
  }
  .field.mnemonic {
    border-left: 2px solid #e0e0e0;
    padding-left: 8px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
    cursor: pointer;
    user-select: none;
  }
  .collapse-arrow {
    font-size: 10px;
    color: #999;
  }
  .label {
    font-size: 13px;
    font-weight: 500;
  }
  .mnemonic-hint {
    font-weight: 400;
    color: #999;
    font-size: 12px;
    margin-left: 4px;
  }
  .required {
    color: #e53935;
    margin-left: 2px;
  }
  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ddd;
    color: #666;
    font-size: 9px;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    user-select: none;
  }
  .field:hover .info-icon {
    opacity: 1;
  }
  .info-icon:hover {
    background: #ccc;
    color: #444;
  }
  .body {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .body > :last-child {
    flex: 1;
    min-width: 0;
  }
  .inject-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    color: #bbb;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .inject-toggle:hover {
    background: #f5f5f5;
    color: #888;
  }
  .inject-toggle.active {
    background: #fff8e1;
    border-color: #ffc107;
    color: #f9a825;
  }
</style>
