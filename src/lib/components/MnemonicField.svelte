<script>
  import { getSpecSync, isMnemonicRef, isMnemonicFactory, isNestedParam, isMnemonicType } from '../specApi.js';
  import ParamField from './ParamField.svelte';

  let { param, value, onchange } = $props();

  // Resolve the spec for this param's mnemonic
  let spec = $derived(getSpecSync(param.mnemonic));

  // Collect all concrete implementations recursively (flattened)
  function collectConcretes(mnemonic, seen = new Set()) {
    if (seen.has(mnemonic)) return [];
    seen.add(mnemonic);
    const s = getSpecSync(mnemonic);
    if (!s) return [];
    if (s.category === 'CONCRETE') return [mnemonic];
    const result = [];
    for (const impl of s.implementations ?? []) {
      result.push(...collectConcretes(impl, seen));
    }
    return result;
  }

  let concretes = $derived(spec ? collectConcretes(param.mnemonic) : []);

  // Current selection
  let selectedType = $derived(isMnemonicRef(value) ? value.__mnemonicType : '');
  let selectedSpec = $derived(selectedType ? getSpecSync(selectedType) : null);
  let innerValues = $derived(isMnemonicRef(value) ? value.__mnemonicValues ?? {} : {});
  let isFactory = $derived(isMnemonicFactory(value));

  // Get editable params for the selected concrete type (exclude nested/delegating)
  let selectedParams = $derived.by(() => {
    if (!selectedSpec) return [];
    return Object.values(selectedSpec.parameters)
      .filter((p) => p.name !== '@delegating@' && !isNestedParam(p))
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  });

  function onTypeChange(e) {
    const mnemonic = e.target.value;
    if (!mnemonic) {
      onchange('');
      return;
    }
    onchange({ __mnemonicType: mnemonic, __mnemonicValues: {} });
  }

  function toggleFactory() {
    if (!isMnemonicRef(value)) return;
    onchange({ __mnemonicType: selectedType, __mnemonicFactory: !isFactory, __mnemonicValues: innerValues });
  }

  function setInnerValue(name, val) {
    const updated = { ...innerValues, [name]: val };
    const ref = { __mnemonicType: selectedType, __mnemonicValues: updated };
    if (isFactory) ref.__mnemonicFactory = true;
    onchange(ref);
  }
</script>

<div class="mnemonic-field">
  <div class="mnemonic-header">
    <select value={selectedType} onchange={onTypeChange}>
      <option value="">-- select {param.mnemonic} --</option>
      {#each concretes as impl (impl)}
        <option value={impl}>{impl}</option>
      {/each}
    </select>
    {#if selectedType}
      <label class="factory-toggle" title="Use factory pattern">
        <input type="checkbox" checked={isFactory} onchange={toggleFactory} />
        <span class="factory-label">factory</span>
      </label>
    {/if}
  </div>

  {#if selectedSpec && selectedParams.length > 0}
    <div class="mnemonic-params">
      {#each selectedParams as p (p.name)}
        <div class="mnemonic-param">
          <span class="param-name">
            {p.name}
            {#if p.required}<span class="required">*</span>{/if}
          </span>
          <span class="param-hint">{p.mnemonic}{p.injectionStrategy && p.injectionStrategy !== 'DIRECT' ? ` · ${p.injectionStrategy}` : ''}</span>
          <ParamField
            param={p}
            value={innerValues[p.name] ?? ''}
            onchange={(v) => setInnerValue(p.name, v)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .mnemonic-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .mnemonic-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .mnemonic-header select {
    flex: 1;
    min-width: 0;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
    background: white;
  }

  .mnemonic-header select:focus {
    outline: none;
    border-color: #666;
  }

  .factory-toggle {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .factory-toggle input[type="checkbox"] {
    width: 0.85rem;
    height: 0.85rem;
    cursor: pointer;
  }

  .factory-label {
    font-size: 0.7rem;
    color: #888;
    white-space: nowrap;
  }

  .mnemonic-params {
    padding: 0.5rem;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    background: #fafafa;
  }

  .mnemonic-param {
    margin-bottom: 0.5rem;
  }

  .mnemonic-param:last-child {
    margin-bottom: 0;
  }

  .param-name {
    font-size: 0.8rem;
    font-weight: 500;
    display: block;
  }

  .required {
    color: #d32f2f;
    margin-left: 0.15rem;
  }

  .param-hint {
    font-size: 0.65rem;
    color: #888;
    display: block;
    margin-bottom: 0.2rem;
  }
</style>
