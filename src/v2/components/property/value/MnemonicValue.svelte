<script>
  import { getSpecSync, fetchSpec, getConcreteImplementations } from '../../../../lib/specApi.js';
  import ParameterField from '../ParameterField.svelte';
  import DocsPopover from '../../../../lib/components/DocsPopover.svelte';
  import Self from './MnemonicValue.svelte';

  let { mnemonic } = $props();

  let spec = $state(null);
  let implementations = $derived(spec ? getConcreteImplementations(mnemonic) : []);
  let selectedType = $state(null);

  $effect(() => {
    const cached = getSpecSync(mnemonic);
    if (cached) {
      spec = cached;
    } else {
      fetchSpec(mnemonic).then((fetched) => { spec = fetched; });
    }
  });

  let showDocs = $state(false);
  let docsPinned = $state(false);
  let docsHoverTimer = null;
  let docsMnemonic = $derived(selectedType ?? mnemonic);

  function onDocsEnter() {
    clearTimeout(docsHoverTimer);
    if (!docsPinned) showDocs = true;
  }
  function onDocsLeave() {
    if (!docsPinned) {
      docsHoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }
  function onDocsPopoverEnter() { clearTimeout(docsHoverTimer); }
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

  const PRIMITIVE_MNEMONICS = [
    'String', 'Boolean', 'boolean', 'Integer', 'int', 'Long', 'long',
    'Double', 'double', 'Float', 'float', 'Character', 'char',
    'Byte', 'byte', 'Short', 'short',
  ];
  let isPrimitive = $derived(
    PRIMITIVE_MNEMONICS.includes(mnemonic) || spec?.category === 'ENUM'
  );

  let params = $derived(
    spec?.parameters
      ? Object.values(spec.parameters)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : []
  );
</script>

<div class="mnemonic-value">
  {#if implementations.length > 0}
    <div class="select-row">
      <select value={selectedType ?? ''} onchange={(e) => selectedType = /** @type {HTMLSelectElement} */ (e.target).value || null}>
        <option value="">-- select --</option>
        {#each implementations as impl}
          <option value={impl}>{impl}</option>
        {/each}
      </select>
      {#if selectedType}
        <span class="info-icon" role="button" tabindex="-1"
          onmouseenter={onDocsEnter}
          onmouseleave={onDocsLeave}
          onclick={onDocsClick}
          onkeydown={onDocsClick}>i</span>
      {/if}
    </div>
  {/if}

  {#if isPrimitive}
    <ParameterField parameterSpec={{ mnemonic }} />
  {:else}
    {#each params as param (param.name)}
      <ParameterField parameterSpec={param} />
    {/each}

    {#if selectedType}
      {#key selectedType}
        <Self mnemonic={selectedType} />
      {/key}
    {/if}
  {/if}
</div>
{#if showDocs && docsMnemonic}
  <DocsPopover
    url="/docs/autogen.md?target={docsMnemonic}"
    title={docsMnemonic}
    pinned={docsPinned}
    onclose={closeDocs}
    onmouseenter={onDocsPopoverEnter}
    onmouseleave={onDocsPopoverLeave}
  />
{/if}

<style>
  .mnemonic-value {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .select-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
  }
  .select-row select {
    margin-bottom: 0;
  }
  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ddd;
    color: #666;
    font-size: 9px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
  }
  .info-icon:hover {
    background: #ccc;
    color: #444;
  }
  select {
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
    background: white;
    margin-bottom: 6px;
  }
  select:focus {
    outline: none;
    border-color: #4a9eff;
  }
</style>
