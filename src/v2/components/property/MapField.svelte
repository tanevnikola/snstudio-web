<script>
  import ParameterField from '../ParameterField.svelte';

  let { yaml = null, key = '', parameterSpec = null } = $props();

  let entrySpec = $derived({ ...parameterSpec, name: null, injectionStrategy: null });
  let entries = $state([]);

  function addEntry() {
    entries.push({ id: crypto.randomUUID(), key: '' });
  }

  function removeEntry(id) {
    entries = entries.filter((e) => e.id !== id);
  }
</script>

<div class="map-value">
  {#each entries as entry (entry.id)}
    <div class="entry">
      <div class="entry-header">
        <button class="remove-btn" onclick={() => removeEntry(entry.id)} title="Remove entry">&times;</button>
        <input type="text" class="key-input" placeholder="key"
          value={entry.key}
          oninput={(e) => entry.key = /** @type {HTMLInputElement} */ (e.target).value} />
      </div>
      <ParameterField parameterSpec={entrySpec} />
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
