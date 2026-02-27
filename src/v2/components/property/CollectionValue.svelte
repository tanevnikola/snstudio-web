<script>
    import { deriveCollectionItemSpec } from '../../parameterSpecUtils';
  import { normalizeParameterValue } from '../../yamlUtils';
import ParameterField from './ParameterField.svelte';

  let { yaml = null, parameterSpec = null, context = {}, onchange = () => {} } = $props();

  let entries = $state([]);

  function emitCollection() {
    onchange(entries.map(e => e.value));
  }

  function handleEntryChange(id, value) {
    const entry = entries.find(e => e.id === id);
    if (entry) entry.value = value;
    emitCollection();
  }

  function addEntry() {
    entries.push({ id: crypto.randomUUID() });
    emitCollection();
  }

  function removeEntry(id) {
    entries = entries.filter((e) => e.id !== id);
    emitCollection();
  }

  $effect(() => {
    if (Array.isArray(yaml)) {
      entries = yaml.map(item => ({ id: crypto.randomUUID(), value: item }));
    }
  });
</script>

<div class="collection-value">
  {#each entries as entry (entry.id)}
    <div class="entry">
      <button class="remove-btn" onclick={() => removeEntry(entry.id)} title="Remove entry">&times;</button>
      <div class="entry-value">
        <ParameterField
          parameterYaml={normalizeParameterValue(entry.value, deriveCollectionItemSpec(parameterSpec))}
          parameterSpec={deriveCollectionItemSpec(parameterSpec)}
          context={context}
          onchange={(value) => handleEntryChange(entry.id, value)}
        />
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
    padding: 8px;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    background: var(--surface-2);
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
    color: var(--text-muted);
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .remove-btn:hover {
    background: var(--danger-subtle);
    color: var(--danger);
  }
  .add-btn {
    align-self: flex-start;
    padding: 2px 8px;
    border: 1px dashed var(--border-default);
    border-radius: 4px;
    background: none;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
  }
  .add-btn:hover {
    border-color: var(--border-strong);
    color: var(--text-primary);
    background: var(--surface-3);
  }
</style>
