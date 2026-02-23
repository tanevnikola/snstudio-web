<script>
  import { getConcreteImplementations, isImplementingSync } from '../../../../lib/specApi.js';
  import { markDirty } from '../../composer/selectionState.svelte.js';
  import MnemonicValue from './MnemonicValue.svelte';

  let { yaml, parameterSpec } = $props();

  let isDelegating = $derived(parameterSpec?.name === '@delegating@');
  let injectorOptions = $derived(getConcreteImplementations('ResourceInjector'));

  let currentValue = $derived(isDelegating ? yaml?.v : yaml?.v?.[parameterSpec?.name]);
  let currentType = $derived(currentValue?.t ?? null);

  function handleChange(e) {
    const selected = e.target.value;
    if (isDelegating) {
      yaml.v = selected ? { t: selected, v: {} } : null;
    } else {
      if (!yaml.v) yaml.v = {};
      if (selected) {
        yaml.v[parameterSpec.name] = { t: selected, v: {} };
      } else {
        delete yaml.v[parameterSpec.name];
      }
    }
    markDirty();
  }
</script>

<div class="injected-value">
  <select class="injector-select" onchange={handleChange} value={currentType ?? ''}>
    <option value="">— Select Injector —</option>
    {#each injectorOptions as opt}
      <option value={opt}>{opt}</option>
    {/each}
  </select>
  {#if currentType}
    <MnemonicValue yaml={currentValue} mnemonic={currentType} />
  {/if}
</div>

<style>
  .injected-value {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .injector-select {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
    background: white;
  }
  .injector-select:focus {
    outline: none;
    border-color: #4a9eff;
  }
</style>
