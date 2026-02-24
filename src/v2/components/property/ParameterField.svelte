<script>
  import { isDelegating, isMapInjection, isCollectionInjection } from '../../parameterSpecUtils.js';
  import { markDirty } from '../composer/selectionState.svelte.js';
  import DirectField from './DirectField.svelte';
  import MapField from './MapField.svelte';
  import CollectionField from './CollectionField.svelte';

  let { yaml, parameterSpec } = $props();

  let parameterYaml = $derived(isDelegating(parameterSpec) ? yaml?.v : yaml?.v?.[parameterSpec?.name]);

  function ensureV() {
    if (!yaml.v) yaml.v = {};
    return yaml.v;
  }

  function handleChange(newValue) {
    ensureV()[parameterSpec.name] = newValue;
    markDirty();
  }
</script>

<div class="field">
  <span class="label">
    {parameterSpec.name}
    {#if parameterSpec.required}<span class="required">*</span>{/if}
  </span>

  <div class="value">
    {#if isMapInjection(parameterSpec)}
      <MapField yaml={yaml?.v} parameterSpec={parameterSpec} />
    {:else if isCollectionInjection(parameterSpec)}
      <CollectionField yaml={yaml?.v} parameterSpec={parameterSpec} />
    {:else}
      <DirectField yaml={parameterYaml} parameterSpec={parameterSpec} onchange={handleChange} />
    {/if}
  </div>
</div>

<style>
  .field {
    margin-bottom: 8px;
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
</style>
