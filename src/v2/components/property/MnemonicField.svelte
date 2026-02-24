<script>
  import { getSpec, fetchSpec, getImplementations, getNonDomainFunctionParameters } from '../../mnemoUtils.js';
  import ParameterField from './ParameterField.svelte';
  import DocsPopover from '../DocsPopover.svelte';
  import Self from './MnemonicField.svelte';
    import { extractParameterYaml } from '../../yamlUtils.js';

  let { yaml, mnemonic } = $props();

  let mnemonicSpec = $state(null);
  let implementations = $derived(mnemonicSpec ? getImplementations(mnemonic) : []);
  let selectedType = $state(null);

  $effect(() => {
    const cached = getSpec(mnemonic);
    if (cached) {
      mnemonicSpec = cached;
    } else {
      fetchSpec(mnemonic).then((fetched) => { mnemonicSpec = fetched; });
    }
  });

  let showDocs = $state(false);
  let docsPinned = $state(false);
  let docsHoverTimer = null;
  let docsMnemonic = $derived(selectedType ?? mnemonic);

  let params = $derived(getNonDomainFunctionParameters(mnemonicSpec));

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


  $effect(() => {
    console.log('[MnemonicValue] mnemo:', mnemonic, 'yaml:', yaml);

  });
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

  {#each params as param (param.name)}
    <ParameterField parameterYaml={extractParameterYaml(yaml.v, param)} parameterSpec={param} />
  {/each}

  {#if selectedType}
    {#key selectedType}
      <Self yaml={{ t: selectedType, v: {} }} mnemonic={selectedType} />
    {/key}
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
