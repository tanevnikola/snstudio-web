<script>
  import { isNestedParam, isPrimitive, fetchSpec, getNode } from './specApi.js';

  let { nodeId } = $props();

  // Get the raw node from the registry — we read spec/mnemonic from it
  // but manage values in local $state for reactivity
  const node = getNode(nodeId);
  const params = Object.values(node.spec.parameters).filter((p) => !isNestedParam(p));

  // Local reactive copy of values — edits here, synced back to node
  let values = $state({ ...node.values });

  // Sync local values back to the registry node whenever they change
  $effect(() => {
    node.values = { ...values };
  });

  // Resolved enum values: paramName → string[] or null
  let enumCache = $state({});

  async function resolveEnum(param) {
    if (isPrimitive(param.mnemonic) || !param.mnemonic) return;
    try {
      const spec = await fetchSpec(param.mnemonic);
      if (spec.category === 'ENUM' && spec.constraints?.values) {
        enumCache = { ...enumCache, [param.name]: spec.constraints.values };
      }
    } catch {
      // not an enum or fetch failed — leave as text
    }
  }

  // Resolve enums for unknown mnemonics on mount
  for (const param of params) {
    if (param.mnemonic && !isPrimitive(param.mnemonic)) {
      resolveEnum(param);
    }
  }

  function getValue(name) {
    return values[name] ?? '';
  }

  function setValue(name, value) {
    values = { ...values, [name]: value };
  }

  function getBoolValue(name) {
    const v = values[name];
    return v === true || v === 'true';
  }

  function getMapEntries(name) {
    return values[name] || [];
  }

  function addMapEntry(name) {
    const current = values[name] || [];
    values = { ...values, [name]: [...current, { key: '', value: '' }] };
  }

  function removeMapEntry(name, index) {
    const current = values[name] || [];
    values = { ...values, [name]: current.filter((_, i) => i !== index) };
  }

  function updateMapEntry(name, index, field, value) {
    const current = [...(values[name] || [])];
    current[index] = { ...current[index], [field]: value };
    values = { ...values, [name]: current };
  }

  function getCollectionEntries(name) {
    return values[name] || [];
  }

  function addCollectionEntry(name) {
    const current = values[name] || [];
    values = { ...values, [name]: [...current, ''] };
  }

  function removeCollectionEntry(name, index) {
    const current = values[name] || [];
    values = { ...values, [name]: current.filter((_, i) => i !== index) };
  }

  function updateCollectionEntry(name, index, value) {
    const current = [...(values[name] || [])];
    current[index] = value;
    values = { ...values, [name]: current };
  }
</script>

<div class="panel">
  <h3>{node.mnemonic}</h3>

  {#each params as param (param.name)}
    <div class="param">
      <span class="param-name">
        {param.name}
        {#if param.required}<span class="required">*</span>{/if}
      </span>
      <span class="param-hint">{param.mnemonic}{param.injectionStrategy && param.injectionStrategy !== 'DIRECT' ? ` · ${param.injectionStrategy}` : ''}</span>

      {#if param.mnemonic === 'Boolean'}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={getBoolValue(param.name)}
            onchange={(e) => setValue(param.name, e.target.checked)}
          />
          {getBoolValue(param.name) ? 'true' : 'false'}
        </label>

      {:else if enumCache[param.name]}
        <select
          value={getValue(param.name)}
          onchange={(e) => setValue(param.name, e.target.value)}
        >
          <option value="">-- select --</option>
          {#each enumCache[param.name] as val (val)}
            <option value={val}>{val}</option>
          {/each}
        </select>

      {:else if param.injectionStrategy === 'MAP'}
        <div class="map-entries">
          {#each getMapEntries(param.name) as entry, i (i)}
            <div class="map-row">
              <input
                type="text"
                class="map-key"
                placeholder="key"
                value={entry.key}
                oninput={(e) => updateMapEntry(param.name, i, 'key', e.target.value)}
              />
              <input
                type="text"
                class="map-value"
                placeholder="value"
                value={entry.value}
                oninput={(e) => updateMapEntry(param.name, i, 'value', e.target.value)}
              />
              <button class="remove-btn" onclick={() => removeMapEntry(param.name, i)}>✕</button>
            </div>
          {/each}
          <button class="add-btn" onclick={() => addMapEntry(param.name)}>+ add entry</button>
        </div>

      {:else if param.injectionStrategy === 'COLLECTION'}
        <div class="collection-entries">
          {#each getCollectionEntries(param.name) as entry, i (i)}
            <div class="collection-row">
              <input
                type="text"
                value={entry}
                placeholder="value"
                oninput={(e) => updateCollectionEntry(param.name, i, e.target.value)}
              />
              <button class="remove-btn" onclick={() => removeCollectionEntry(param.name, i)}>✕</button>
            </div>
          {/each}
          <button class="add-btn" onclick={() => addCollectionEntry(param.name)}>+ add</button>
        </div>

      {:else}
        <input
          type="text"
          value={getValue(param.name)}
          placeholder={param.defaultValue != null ? String(param.defaultValue) : ''}
          oninput={(e) => setValue(param.name, e.target.value)}
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  .panel {
    padding: 1rem;
    overflow-y: auto;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
  }

  .param {
    margin-bottom: 0.75rem;
  }

  .param-name {
    font-size: 0.85rem;
    font-weight: 500;
    display: block;
  }

  .required {
    color: #d32f2f;
    margin-left: 0.15rem;
  }

  .param-hint {
    font-size: 0.7rem;
    color: #888;
    display: block;
    margin-bottom: 0.25rem;
  }

  input[type="text"] {
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #666;
  }

  select {
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
    background: white;
  }

  select:focus {
    outline: none;
    border-color: #666;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #555;
    cursor: pointer;
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }

  .map-entries, .collection-entries {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .map-row {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .map-key {
    width: 40% !important;
  }

  .map-value {
    flex: 1;
  }

  .collection-row {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .collection-row input {
    flex: 1;
  }

  .remove-btn {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: #ccc;
    cursor: pointer;
    padding: 0.2rem;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    color: #d32f2f;
  }

  .add-btn {
    background: none;
    border: 1px dashed #ccc;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    color: #888;
    cursor: pointer;
    text-align: left;
  }

  .add-btn:hover {
    border-color: #999;
    color: #555;
  }
</style>
