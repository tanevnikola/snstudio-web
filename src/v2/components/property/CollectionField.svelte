<script>
  import ParameterField from '../ParameterField.svelte';

  let { yaml = null, key = '', parameterSpec = null } = $props();

  let entrySpec = $derived({ ...parameterSpec, name: null, injectionStrategy: null });
  let entries = $state([]);

  function addEntry() {
    entries.push({ id: crypto.randomUUID() });
  }

  function removeEntry(id) {
    entries = entries.filter((e) => e.id !== id);
  }
</script>

<div class="collection-value">
  {#each entries as entry (entry.id)}
    <div class="entry">
      <button class="remove-btn" onclick={() => removeEntry(entry.id)} title="Remove entry">&times;</button>
      <div class="entry-value">
        <ParameterField parameterSpec={entrySpec} />
      </div>
    </div>
  {/each}
  <button class="add-btn" onclick={addEntry}>+ add entry</button>
</div>

<style>
  .collection-value {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .entry {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 6px;
  }
  .entry-value {
    flex: 1;
    min-width: 0;
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
