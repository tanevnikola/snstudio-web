<script>
  import { isMapInjection, isCollectionInjection, isDelegating } from '../../parameterSpecUtils.js';
  import DirectField from './DirectField.svelte';
  import MapField from './MapField.svelte';
  import CollectionField from './CollectionField.svelte';
  
  let { parameterYaml, parameterSpec, onchange = () => {} } = $props();
</script>

{#snippet fieldContent()}
  {#if isMapInjection(parameterSpec)}
    <MapField
      yaml={parameterYaml}
      parameterSpec={parameterSpec}
      onchange={onchange}
    />
  {:else if isCollectionInjection(parameterSpec)}
    <CollectionField
      yaml={parameterYaml}
      parameterSpec={parameterSpec}
      onchange={onchange}
    />
  {:else}
    <DirectField
      yaml={parameterYaml}
      parameterSpec={parameterSpec}
      onchange={onchange}
    />
  {/if}
{/snippet}

{#if isDelegating(parameterSpec)}
  {@render fieldContent()}
{:else}
  <div class="field">
    <span class="label">
      {parameterSpec.name}
      {#if parameterSpec.required}<span class="required">*</span>{/if}
    </span>
    <div class="value">
      {@render fieldContent()}
    </div>
  </div>
{/if}

<style>
  .field {
    margin-bottom: 8px;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fafafa;
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
