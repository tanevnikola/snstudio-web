<script>
  import { isInjectionPoint, isNestedParam, isPrimitive, isMnemonicType, fetchSpec } from '../specApi.js';
  import InjectorField from './InjectorField.svelte';
  import MnemonicField from './MnemonicField.svelte';

  let { param, value, onchange } = $props();

  const STRING_LIKE = ['String', 'Object'];
  const isStringLike = STRING_LIKE.includes(param.mnemonic);

  // Multiline toggle – auto-enable when value contains newlines
  let multiline = $state(false);

  $effect(() => {
    if (isStringLike && typeof value === 'string' && value.includes('\n')) {
      multiline = true;
    }
  });

  // Enum resolution
  let enumValues = $state(null);
  if (param.mnemonic && !isPrimitive(param.mnemonic) && !isInjectionPoint(param)) {
    fetchSpec(param.mnemonic).then((spec) => {
      if (spec.category === 'ENUM' && spec.constraints?.values) {
        enumValues = spec.constraints.values;
      }
    }).catch(() => {});
  }

  // Value helpers
  function getVal() {
    return value ?? '';
  }
  function getBool() {
    return value === true || value === 'true';
  }
  function getMapEntries() {
    return value || [];
  }
  function getCollectionEntries() {
    return value || [];
  }

  // MAP helpers
  function addMapEntry() {
    onchange([...(value || []), { key: '', value: '' }]);
  }
  function removeMapEntry(index) {
    const updated = (value || []).filter((_, i) => i !== index);
    onchange(updated);
  }
  function updateMapEntry(index, field, val) {
    const current = [...(value || [])];
    current[index] = { ...current[index], [field]: val };
    onchange(current);
  }

  // Compute uniform key width from the widest key text across all entries
  const MAP_KEY_MIN = 32;   // px – minimum width (fits ~2-3 chars)
  const MAP_KEY_MAX = 170;  // px – maximum width
  const MAP_KEY_PAD = 18;   // px – padding inside the input (0.5rem * 2 ≈ 16 + buffer)

  let mapKeyMeasurer = $state(null);

  let mapKeyWidth = $derived.by(() => {
    const entries = getMapEntries();
    if (!mapKeyMeasurer || entries.length === 0) return MAP_KEY_MIN;
    // measure each key string
    let widest = 0;
    for (const entry of entries) {
      mapKeyMeasurer.textContent = entry.key || 'key'; // placeholder text as min
      const w = mapKeyMeasurer.scrollWidth;
      if (w > widest) widest = w;
    }
    return Math.max(MAP_KEY_MIN, Math.min(MAP_KEY_MAX, widest + MAP_KEY_PAD));
  });

  // COLLECTION helpers
  function addCollectionEntry() {
    onchange([...(value || []), '']);
  }
  function removeCollectionEntry(index) {
    const updated = (value || []).filter((_, i) => i !== index);
    onchange(updated);
  }
  function updateCollectionEntry(index, val) {
    const current = [...(value || [])];
    current[index] = val;
    onchange(current);
  }
</script>

{#if param.injectionStrategy === 'MAP'}
  <!-- hidden measurer for uniform key width -->
  <span class="map-key-measurer" bind:this={mapKeyMeasurer}></span>
  <div class="map-entries">
    {#each getMapEntries() as entry, i (i)}
      <div class="map-row">
        <input
          type="text"
          class="map-key"
          placeholder="key"
          value={entry.key}
          style="width:{mapKeyWidth}px"
          oninput={(e) => updateMapEntry(i, 'key', e.target.value)}
        />
        {#if isInjectionPoint(param)}
          <InjectorField
            value={entry.value}
            param={{ ...param, injectionStrategy: 'DIRECT' }}
            onchange={(v) => updateMapEntry(i, 'value', v)}
          />
        {:else}
          <input
            type="text"
            class="map-value"
            placeholder="value"
            value={entry.value}
            oninput={(e) => updateMapEntry(i, 'value', e.target.value)}
          />
        {/if}
        <button class="remove-btn" onclick={() => removeMapEntry(i)}>✕</button>
      </div>
    {/each}
    <button class="add-btn" onclick={addMapEntry}>+ add entry</button>
  </div>

{:else if param.injectionStrategy === 'COLLECTION'}
  <div class="collection-entries">
    {#each getCollectionEntries() as entry, i (i)}
      <div class="collection-row">
        {#if isInjectionPoint(param)}
          <InjectorField
            value={entry}
            param={{ ...param, injectionStrategy: 'DIRECT' }}
            onchange={(v) => updateCollectionEntry(i, v)}
          />
        {:else}
          <input
            type="text"
            value={entry}
            placeholder="value"
            oninput={(e) => updateCollectionEntry(i, e.target.value)}
          />
        {/if}
        <button class="remove-btn" onclick={() => removeCollectionEntry(i)}>✕</button>
      </div>
    {/each}
    <button class="add-btn" onclick={addCollectionEntry}>+ add</button>
  </div>

{:else if isMnemonicType(param)}
  <MnemonicField {param} {value} {onchange} />

{:else if isInjectionPoint(param)}
  <InjectorField
    value={getVal()}
    {param}
    onchange={(v) => onchange(v)}
  />

{:else if param.mnemonic === 'Boolean'}
  <label class="checkbox-label">
    <input
      type="checkbox"
      checked={getBool()}
      onchange={(e) => onchange(e.target.checked)}
    />
    {getBool() ? 'true' : 'false'}
  </label>

{:else if enumValues}
  <select
    value={getVal()}
    onchange={(e) => onchange(e.target.value)}
  >
    <option value="">-- select --</option>
    {#each enumValues as val (val)}
      <option value={val}>{val}</option>
    {/each}
  </select>

{:else}
  <div class="text-field-row">
    {#if isStringLike}
      <button
        class="multiline-toggle"
        class:active={multiline}
        onclick={() => (multiline = !multiline)}
        title={multiline ? 'Single line' : 'Multi line'}
      >&#x2261;</button>
    {/if}
    {#if multiline && isStringLike}
      <textarea
        class="multiline-input"
        value={getVal()}
        placeholder={param.defaultValue != null ? String(param.defaultValue) : ''}
        oninput={(e) => onchange(e.target.value)}
        rows="4"
      ></textarea>
    {:else}
      <input
        type="text"
        value={getVal()}
        placeholder={param.defaultValue != null ? String(param.defaultValue) : ''}
        oninput={(e) => onchange(e.target.value)}
      />
    {/if}
  </div>
{/if}

<style>
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

  .map-key-measurer {
    position: absolute;
    visibility: hidden;
    white-space: pre;
    font-size: 0.8rem;
    font-family: inherit;
    pointer-events: none;
  }

  .map-key {
    flex-shrink: 0;
    flex-grow: 0;
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
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #bbb;
    cursor: pointer;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    line-height: 1;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .remove-btn:hover {
    color: #d32f2f;
    border-color: #d32f2f;
    background: #fef2f2;
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

  .text-field-row {
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .text-field-row input[type="text"] {
    flex: 1;
  }

  .multiline-toggle {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 0.85rem;
    cursor: pointer;
    flex-shrink: 0;
    color: #bbb;
    line-height: 1;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .multiline-toggle:hover {
    border-color: #999;
    color: #666;
  }

  .multiline-toggle.active {
    background: #f0e8fe;
    border-color: #8a5ad9;
    color: #8a5ad9;
  }

  .multiline-input {
    flex: 1;
    width: 100%;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
    resize: vertical;
  }

  .multiline-input:focus {
    outline: none;
    border-color: #666;
  }
</style>
