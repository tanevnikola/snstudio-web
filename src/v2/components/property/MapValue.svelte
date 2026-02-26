<script>
  import { deriveMapItemSpec } from '../../parameterSpecUtils';
  import { normalizeParameterValue } from '../../yamlUtils';
  import ParameterField from './ParameterField.svelte';

  let { yaml = null, parameterSpec = null, onchange = () => {} } = $props();

  let entrySpec = $derived(deriveMapItemSpec(parameterSpec));
  let keys = $derived(yaml ? Object.keys(yaml) : []);

  function handleValueChange(key, value) {
    onchange({ ...yaml, [key]: value });
  }

  function handleKeyChange(oldKey, newKey) {
    if (oldKey === newKey) return;
    const { [oldKey]: value, ...rest } = yaml;
    onchange({ ...rest, [newKey]: value });
  }

  function addEntry() {
    onchange({ ...yaml, '': null });
  }

  function removeEntry(key) {
    const { [key]: _, ...rest } = yaml;
    onchange(rest);
  }
</script>

<div class="map-value">
  {#each keys as key (key)}
    <div class="entry">
      <div class="entry-header">
        <button class="remove-btn" onclick={() => removeEntry(key)} title="Remove entry">&times;</button>
        <input type="text" class="key-input" placeholder="key"
          value={key}
          onblur={(e) => handleKeyChange(key, /** @type {HTMLInputElement} */ (e.target).value)} />
      </div>
      <ParameterField
        parameterYaml={normalizeParameterValue(yaml[key], entrySpec)}
        parameterSpec={entrySpec}
        onchange={(value) => handleValueChange(key, value)}
      />
    </div>
  {/each}
  <button class="add-btn" onclick={addEntry}>+ add entry</button>
</div>

<style>
  .map-value {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .entry {
    display: flex;
    flex-direction: column;
    margin-bottom: 6px;
    padding: 8px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fafafa;
  }
  .entry-header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }
  .key-input {
    flex: 1;
    min-width: 0;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
  }
  .key-input:focus {
    outline: none;
    border-color: #4a9eff;
  }
  .remove-btn {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: #999;
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .remove-btn:hover {
    background: #fee;
    color: #e53935;
  }
  .add-btn {
    align-self: flex-start;
    padding: 2px 8px;
    border: 1px dashed #ccc;
    border-radius: 4px;
    background: none;
    color: #888;
    font-size: 12px;
    cursor: pointer;
  }
  .add-btn:hover {
    border-color: #999;
    color: #555;
    background: #fafafa;
  }
</style>
