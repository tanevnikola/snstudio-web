<script>
  import ConfirmDeleteButton from '../ConfirmDeleteButton.svelte';
  import DomainFunctionBlock from './DomainFunctionBlock.svelte';
  import DomainFunctionMapBlock from './DomainFunctionMapBlock.svelte';
  import DomainFunctionListBlock from './DomainFunctionListBlock.svelte';
  import { fetchSpec } from '../../../lib/specApi.js';

  let { yaml = {}, detail = '', ondelete = () => {} } = $props();

  let mnemonic = $derived(yaml?.t ?? '');
  let mnemonicSpec = $state(null);

  $effect(() => {
    const m = mnemonic;
    if (!m) { mnemonicSpec = null; return; }
    fetchSpec(m).then(spec => {
      if (mnemonic === m) mnemonicSpec = spec;
    }).catch(() => {
      if (mnemonic === m) mnemonicSpec = null;
    });
  });

  let domainFunctionParams = $derived.by(() => {
    if (!mnemonicSpec?.parameters) return [];
    return Object.entries(mnemonicSpec.parameters)
      .filter(([, param]) => param.mnemonic === 'DomainFunction')
      .map(([name, param]) => ({ name, ...param }));
  });

  function getParamYaml(param) {
    if (param.name === '@delegating@') {
      return yaml?.v;
    }
    return yaml?.v?.[param.name];
  }
</script>

<div class="block">
  <div class="delete">
    <ConfirmDeleteButton onclick={ondelete} />
  </div>
  <div class="info">
    <span class="title">{mnemonic}</span>
    {#if detail}
      <span class="detail">{detail}</span>
    {/if}
  </div>
</div>

{#each domainFunctionParams as param (param.name)}
  {#if param.injectionStrategy === 'DIRECT'}
    <DomainFunctionBlock yaml={getParamYaml(param)} />
  {:else if param.injectionStrategy === 'MAP'}
    <DomainFunctionMapBlock yaml={getParamYaml(param)} />
  {:else if param.injectionStrategy === 'COLLECTION'}
    <DomainFunctionListBlock yaml={getParamYaml(param)} />
  {/if}
{/each}

<style>
  .block {
    display: flex;
    align-items: stretch;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
  }

  .delete {
    display: flex;
    flex-shrink: 0;
    border-right: 1px solid #e0e0e0;
    padding: 0 0.4rem;
    align-items: center;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    padding: 0.5rem 0.75rem;
  }

  .title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail {
    font-size: 0.7rem;
    color: #888;
    background: #f0f0f0;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
