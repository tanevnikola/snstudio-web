<script>
  import { getImplementations } from '../../mnemoUtils.js';
  import MnemonicField from './MnemonicField.svelte';

  let { yaml, onchange = () => {} } = $props();

  let injectorOptions = $derived(getImplementations('ResourceInjector'));
  let currentType = $derived(yaml?.t ?? null);

  function handleChange(e) {
    const selected = e.target.value;
    onchange(selected ? { t: selected, v: {} } : null);
  }

  $effect(() => {
    console.log('[InjectionField] yaml:', yaml);
  });
</script>

<div class="injected-value">
  <select class="injector-select" onchange={handleChange} value={currentType ?? ''}>
    <option value="">— Select Injector —</option>
    {#each injectorOptions as opt}
      <option value={opt}>{opt}</option>
    {/each}
  </select>
  {#if currentType}
    {#key currentType}
      <MnemonicField yaml={yaml} mnemonic={currentType} />
    {/key}
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
