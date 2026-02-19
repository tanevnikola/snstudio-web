<script module>
  // Shared collapse state — persists across component instances
  let _collapsed = {};
  let _entryCollapsed = {};
</script>

<script>
  import { getSpecSync, isNestedParam, isMnemonicType, createNode, unregisterDeep } from '../specApi.js';
  import ParamField from './ParamField.svelte';

  let { param, value, onchange } = $props();

  // value IS the child node (or null)
  let selectedType = $derived(value?.mnemonic ?? '');
  let selectedSpec = $derived(selectedType ? getSpecSync(selectedType) : null);
  let isFactory = $derived(value?.factory === true);

  // Resolve the spec for this param's mnemonic (for the type dropdown)
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

  // Get editable params for the selected concrete type (exclude nested/delegating)
  let selectedParams = $derived.by(() => {
    if (!selectedSpec) return [];
    return Object.values(selectedSpec.parameters)
      .filter((p) => p.name !== '@delegating@' && !isNestedParam(p))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  // Version counter — tracks mutations to plain JS objects (value.values, value.children)
  // so Svelte can re-evaluate template expressions that read them.
  let innerVersion = $state(0);

  // Reactive helpers — read innerVersion to create Svelte dependency
  function getInnerValue(name) {
    void innerVersion;
    return value?.values[name] ?? '';
  }
  function getInnerKids(name) {
    void innerVersion;
    return value?.children[name] ?? [];
  }
  function getInnerFirstChild(name) {
    void innerVersion;
    return value?.children[name]?.[0] ?? null;
  }

  // Per-param collapse — initialized from module-level, synced back
  const COLLAPSIBLE = new Set(['MAP', 'COLLECTION']);
  let collapsed = $state({ ..._collapsed });
  function toggleCollapse(name) { collapsed = { ...collapsed, [name]: !collapsed[name] }; }
  $effect(() => { _collapsed = { ...collapsed }; });

  // Per-entry collapse — initialized from module-level, synced back
  let entryCollapsed = $state({ ..._entryCollapsed });
  function toggleEntry(id) { entryCollapsed = { ...entryCollapsed, [id]: !entryCollapsed[id] }; }
  $effect(() => { _entryCollapsed = { ...entryCollapsed }; });

  function onTypeChange(e) {
    const mnemonic = e.target.value;
    // Clean up old node
    if (value) unregisterDeep(value);
    if (!mnemonic) {
      onchange(null);
      return;
    }
    const newSpec = getSpecSync(mnemonic);
    const newNode = createNode(mnemonic, newSpec);
    onchange(newNode);
  }

  function toggleFactory() {
    if (!value) return;
    value.factory = !value.factory;
    onchange(value);
  }

  function setInnerValue(name, val) {
    if (!value) return;
    value.values[name] = val;
    innerVersion++;
    onchange(value);
  }

  function setInnerChildren(name, kids) {
    if (!value) return;
    value.children[name] = kids;
    innerVersion++;
    onchange(value);
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
        {@const isCollapsible = COLLAPSIBLE.has(p.injectionStrategy) || isMnemonicType(p)}
        {@const isCollapsed = isCollapsible && collapsed[p.name]}
        <div class="mnemonic-param">
          <span class="param-name">
            {#if isCollapsible}
              <button class="param-toggle" onclick={() => toggleCollapse(p.name)}>
                <span class="param-arrow">{isCollapsed ? '▶' : '▼'}</span>
              </button>
            {/if}
            {p.name}
            {#if p.required}<span class="required">*</span>{/if}
          </span>
          <span class="param-hint">{p.mnemonic}{p.injectionStrategy && p.injectionStrategy !== 'DIRECT' ? ` · ${p.injectionStrategy}` : ''}</span>
          {#if !isCollapsed}
            {#if isMnemonicType(p)}
              {#if p.injectionStrategy === 'MAP'}
                <!-- MAP of mnemonic children -->
                <div class="map-entries">
                  {#each getInnerKids(p.name) as child, i (child.id)}
                    <div class="map-mnemonic-entry">
                      <div class="map-mnemonic-header">
                        <button class="entry-toggle" onclick={() => toggleEntry(child.id)}>
                          <span class="entry-arrow">{entryCollapsed[child.id] ? '▶' : '▼'}</span>
                        </button>
                        {#if entryCollapsed[child.id]}
                          <span class="entry-label">{child.mapKey || 'key'} <span class="entry-label-hint">({child.mnemonic || p.mnemonic})</span></span>
                        {:else}
                          <input
                            type="text"
                            class="map-key"
                            placeholder="key"
                            value={child.mapKey ?? ''}
                            oninput={(e) => { child.mapKey = e.target.value; onchange(value); }}
                          />
                        {/if}
                        <button class="remove-btn" onclick={() => {
                          unregisterDeep(child);
                          setInnerChildren(p.name, getInnerKids(p.name).filter((_, idx) => idx !== i));
                        }}>✕</button>
                      </div>
                      {#if !entryCollapsed[child.id]}
                        <svelte:self
                          param={p}
                          value={child}
                          onchange={(newChild) => {
                            if (newChild && newChild !== child) {
                              newChild.mapKey = child.mapKey ?? '';
                              const kids = getInnerKids(p.name);
                              const updated = [...kids];
                              updated[i] = newChild;
                              setInnerChildren(p.name, updated);
                            } else if (!newChild) {
                              setInnerChildren(p.name, getInnerKids(p.name).filter((_, idx) => idx !== i));
                            } else {
                              onchange(value);
                            }
                          }}
                        />
                      {/if}
                    </div>
                  {/each}
                  <button class="add-btn" onclick={() => {
                    setInnerChildren(p.name, [...getInnerKids(p.name), createNode('', { parameters: {} })]);
                  }}>+ add entry</button>
                </div>
              {:else if p.injectionStrategy === 'COLLECTION'}
                <!-- COLLECTION of mnemonic children -->
                <div class="collection-entries">
                  {#each getInnerKids(p.name) as child, i (child.id)}
                    <div class="collection-mnemonic-entry">
                      <button class="remove-btn" onclick={() => {
                        unregisterDeep(child);
                        setInnerChildren(p.name, getInnerKids(p.name).filter((_, idx) => idx !== i));
                      }}>✕</button>
                      <svelte:self
                        param={p}
                        value={child}
                        onchange={(newChild) => {
                          if (newChild && newChild !== child) {
                            const kids = getInnerKids(p.name);
                            const updated = [...kids];
                            updated[i] = newChild;
                            setInnerChildren(p.name, updated);
                          } else if (!newChild) {
                            setInnerChildren(p.name, getInnerKids(p.name).filter((_, idx) => idx !== i));
                          } else {
                            onchange(value);
                          }
                        }}
                      />
                    </div>
                  {/each}
                  <button class="add-btn" onclick={() => {
                    setInnerChildren(p.name, [...getInnerKids(p.name), createNode('', { parameters: {} })]);
                  }}>+ add</button>
                </div>
              {:else}
                <!-- DIRECT mnemonic child -->
                <svelte:self
                  param={p}
                  value={getInnerFirstChild(p.name)}
                  onchange={(child) => {
                    const old = value.children[p.name]?.[0];
                    if (old && old !== child) unregisterDeep(old);
                    setInnerChildren(p.name, child ? [child] : []);
                  }}
                />
              {/if}
            {:else}
              <ParamField
                param={p}
                value={getInnerValue(p.name)}
                onchange={(v) => setInnerValue(p.name, v)}
              />
            {/if}
          {/if}
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
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .param-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .param-arrow {
    font-size: 0.55rem;
    color: #999;
  }

  .param-toggle:hover .param-arrow {
    color: #555;
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

  .map-entries, .collection-entries {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .map-mnemonic-entry {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
  }

  .map-mnemonic-header {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }

  .entry-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .entry-arrow {
    font-size: 0.55rem;
    color: #999;
  }

  .entry-toggle:hover .entry-arrow {
    color: #555;
  }

  .entry-label {
    flex: 1;
    font-size: 0.8rem;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entry-label-hint {
    font-weight: 400;
    color: #999;
  }

  .map-key {
    flex: 1;
    font-weight: 500;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
  }

  .map-key:focus {
    outline: none;
    border-color: #666;
  }

  .collection-mnemonic-entry {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
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
</style>
