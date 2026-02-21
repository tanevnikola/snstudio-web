<script>
  import PrimitiveField from './PrimitiveField.svelte';
  import MnemonicField from './MnemonicField.svelte';
  import DocsPopover from '../../lib/components/DocsPopover.svelte';

  let { parameterSpec } = $props();

  const PRIMITIVE_MNEMONICS = [
    'String', 'Boolean', 'boolean', 'Integer', 'int', 'Long', 'long',
    'Double', 'double', 'Float', 'float', 'Character', 'char',
    'Byte', 'byte', 'Short', 'short',
  ];

  let value = $state('');
  let isPrimitive = $derived(PRIMITIVE_MNEMONICS.includes(parameterSpec.mnemonic));
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

<div class="field">
  <div class="header">
    <span class="label">
      {parameterSpec.name}
      {#if parameterSpec.required}<span class="required">*</span>{/if}
    </span>
    <span class="info-icon" role="button" tabindex="-1"
      onmouseenter={onDocsEnter}
      onmouseleave={onDocsLeave}
      onclick={onDocsClick}>i</span>
  </div>

  {#if isPrimitive}
    <PrimitiveField {parameterSpec} />
  {:else}
    <MnemonicField {parameterSpec} />
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
  }
  .header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }
  .label {
    font-size: 13px;
    font-weight: 500;
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
</style>
