<script>
  import { getImplementations, isResourceInjector } from '../../mnemoUtils.js';
  import MnemonicField from './MnemonicField.svelte';

  let { yaml, onchange = () => {} } = $props();

  let possibleInjectors = $derived(getImplementations('ResourceInjector'));

  let selectedInjector = $state(
    isResourceInjector(yaml.t) ? yaml.t : null
  );
  let injectorYamls = $state(
    isResourceInjector(selectedInjector) ? { [selectedInjector]: yaml } : {}
  );

  function handleSelectInjector(e) {
    selectedInjector = e.target.value || null;
  }

  function updateSelectedInjector(updatedYaml) {
    injectorYamls[selectedInjector] = updatedYaml;
    onchange(updatedYaml)
  }

</script>

<div class="injected-value">
  <select class="injector-select" onchange={handleSelectInjector} value={selectedInjector ?? ''}>
    <option value="">— Select Injector —</option>
    {#each possibleInjectors as injector}
      <option value={injector}>{injector}</option>
    {/each}
  </select>
  {#if selectedInjector}
    {#key selectedInjector}
      <MnemonicField 
        yaml={injectorYamls[selectedInjector] ?? { t: selectedInjector }} 
        mnemonic={selectedInjector}
        onchange={updateSelectedInjector}
      />
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
