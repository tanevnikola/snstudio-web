<script>
  import { deriveMapItemSpec } from '../../parameterSpecUtils';
  import { normalizeParameterValue } from '../../yamlUtils';
import ParameterField from './ParameterField.svelte';

  let { yaml = null, parameterSpec = null, onchange = () => {} } = $props();

  let entrySpec = $derived(deriveMapItemSpec(parameterSpec));
  let entries = $state([]);

  function emitMap() {
    onchange(Object.fromEntries(entries.map(e => [e.key, e.value])));
  }

  function handleEntryChange(id, value) {
    const entry = entries.find(e => e.id === id);
    if (entry) entry.value = value;
    emitMap();
  }

  function handleKeyChange(id, newKey) {
    const entry = entries.find(e => e.id === id);
    if (entry) entry.key = newKey;
    emitMap();
  }

  function addEntry() {
    entries.push({ id: crypto.randomUUID(), key: '' });
    emitMap();
  }

  function removeEntry(id) {
    entries = entries.filter((e) => e.id !== id);
    emitMap();
  }

  $effect(() => {
    const map = yaml;
    if (map && typeof map === 'object' && !Array.isArray(map)) {
      entries = Object.keys(map).map(key => ({ id: crypto.randomUUID(), key, value: map[key] }));
    }
  });
</script>

<div class="map-value">
  {#each entries as entry (entry.id)}
    <div class="entry">
      <div class="entry-header">
        <button class="remove-btn" onclick={() => removeEntry(entry.id)} title="Remove entry">&times;</button>
        <input type="text" class="key-input" placeholder="key"
          value={entry.key}
          oninput={(e) => handleKeyChange(entry.id, /** @type {HTMLInputElement} */ (e.target).value)} />
      </div>
      <ParameterField
        parameterYaml={normalizeParameterValue(entry.value, entrySpec)}
        parameterSpec={entrySpec}
        onchange={(value) => handleEntryChange(entry.id, value)}
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
