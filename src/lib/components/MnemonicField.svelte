<script module>
  // Shared collapse state — persists across component instances
  let _collapsed = {};
  let _entryExpanded = {};
</script>

<script>
  import { getSpecSync, isNestedParam, createNode, unregisterDeep } from '../specApi.js';
  import { resolveParam, resolveNode } from '../rules.js';
  import { settings } from '../settings.svelte.js';
  import ParamField from './ParamField.svelte';
  import DocsPopover from './DocsPopover.svelte';

  let { param, value, onchange, facts = null } = $props();

  // value IS the child node (or null)
  let selectedType = $derived(value?.mnemonic ?? '');
  let selectedSpec = $derived(selectedType ? getSpecSync(selectedType) : null);

  // Concretes from parent's facts (passed down from PropertiesPanel)
  let concretes = $derived(facts?.concretes ?? []);

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

  // Sub-param facts from rules engine — read innerVersion so Svelte re-evaluates
  function getSubParamFacts(paramName) {
    void innerVersion;
    return value ? resolveParam(value.id, paramName) : null;
  }

  // Node facts for factory checkbox
  function getNodeFacts() {
    void innerVersion;
    return value ? resolveNode(value.id) : null;
  }

  // Auto-enforce factory when rules require it
  $effect(() => {
    const nf = getNodeFacts();
    if (nf?.mustFactory && value && !value.factory) {
      value.factory = true;
      onchange(value);
    }
  });

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
  let collapsed = $state({ ..._collapsed });
  function toggleCollapse(name) { collapsed = { ...collapsed, [name]: !collapsed[name] }; }
  $effect(() => { _collapsed = { ...collapsed }; });

  // Per-entry expand — entries default to collapsed; explicitly expanded entries tracked here
  let entryExpanded = $state({ ..._entryExpanded });
  function toggleEntry(id) { entryExpanded = { ...entryExpanded, [id]: !entryExpanded[id] }; }
  $effect(() => { _entryExpanded = { ...entryExpanded }; });

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

  function unpinAllDebug() {
    document.querySelectorAll('.debug-popover[data-pinned="1"]').forEach(el => {
      el.dataset.pinned = '';
      el.style.display = '';
    });
  }

  $effect(() => {
    const handler = (e) => {
      if (!e.target.closest('.debug-popover') && !e.target.closest('.debug-icon')) {
        unpinAllDebug();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  });

  // Docs popover state
  let showDocs = $state(false);
  let docsPinned = $state(false);
  let docsHoverTimer = null;
  let docsMnemonic = $state('');

  function onDocsEnter(mnemonic) {
    clearTimeout(docsHoverTimer);
    docsMnemonic = mnemonic;
    if (!docsPinned) showDocs = true;
  }

  function onDocsLeave() {
    if (!docsPinned) {
      docsHoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }

  function onDocsPopoverEnter() {
    clearTimeout(docsHoverTimer);
  }

  function onDocsPopoverLeave() {
    if (!docsPinned) {
      docsHoverTimer = setTimeout(() => { showDocs = false; }, 200);
    }
  }

  function onDocsClick(e, mnemonic) {
    e.stopPropagation();
    e.preventDefault();
    docsMnemonic = mnemonic;
    docsPinned = true;
    showDocs = true;
  }

  function closeDocs() {
    showDocs = false;
    docsPinned = false;
    clearTimeout(docsHoverTimer);
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
      <span class="info-icon" role="button" tabindex="-1" onmouseenter={() => onDocsEnter(selectedType)} onmouseleave={onDocsLeave} onclick={(e) => onDocsClick(e, selectedType)}>i</span>
    {/if}
    {#if selectedType}
      {@const nf = getNodeFacts()}
      {#if nf?.canFactory}
        <label class="factory-toggle" title={nf.mustFactory ? 'Factory required (eager injection point)' : 'Use factory pattern'}>
          <input type="checkbox" checked={value?.factory === true} disabled={nf.mustFactory} onchange={toggleFactory} />
          <span class="factory-label">factory</span>
        </label>
      {/if}
    {/if}
  </div>

  {#if selectedSpec && selectedParams.length > 0}
    <div class="mnemonic-params">
      {#each selectedParams as p (p.name)}
        {@const isCollapsed = collapsed[p.name]}
        <div class="mnemonic-param">
          <span class="param-name">
            <button class="param-toggle" onclick={() => toggleCollapse(p.name)}>
              <span class="param-arrow">{isCollapsed ? '▶' : '▼'}</span>
            </button>
            {p.name}
            {#if p.required}<span class="required">*</span>{/if}
          </span>
          <span class="param-hint">
            {p.mnemonic}{p.injectionStrategy && p.injectionStrategy !== 'DIRECT' ? ` · ${p.injectionStrategy}` : ''}
            <span class="info-icon" role="button" tabindex="-1" onmouseenter={() => onDocsEnter(p.mnemonic)} onmouseleave={onDocsLeave} onclick={(e) => onDocsClick(e, p.mnemonic)}>i</span>
            {#if settings.debug}
              {@const debugFacts = getSubParamFacts(p.name)}
              {#if debugFacts}
                <span class="debug-wrap" onmouseenter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const pop = e.currentTarget.querySelector('.debug-popover');
                  const right = r.right + 6;
                  const maxW = window.innerWidth - 16;
                  if (right + 220 > maxW) {
                    pop.style.left = '';
                    pop.style.right = (window.innerWidth - r.left + 6) + 'px';
                  } else {
                    pop.style.right = '';
                    pop.style.left = right + 'px';
                  }
                  pop.style.top = Math.max(4, Math.min(r.top - 4, window.innerHeight - 300)) + 'px';
                }}>
                  <span class="debug-icon" onclick={(e) => {
                    e.stopPropagation();
                    const pop = e.currentTarget.nextElementSibling;
                    const pinned = pop.dataset.pinned === '1';
                    unpinAllDebug();
                    if (!pinned) {
                      pop.dataset.pinned = '1';
                      pop.style.display = 'block';
                    }
                  }}><svg viewBox="0 0 16 16" width="9" height="9"><circle cx="8" cy="4" r="2" fill="currentColor"/><ellipse cx="8" cy="10" rx="3.5" ry="4" fill="currentColor"/><path d="M1.5 6.5L4.5 8M14.5 6.5L11.5 8M1 10h3.5M15 10h-3.5M1.5 13.5L4.5 12M14.5 13.5L11.5 12" stroke="currentColor" stroke-width="1.2" fill="none"/></svg></span>
                  <div class="debug-popover">
                    <button class="debug-copy" onclick={(e) => {
                      const pre = e.currentTarget.parentElement.querySelector('pre');
                      navigator.clipboard.writeText(pre.textContent);
                      e.currentTarget.textContent = 'copied!';
                      setTimeout(() => e.currentTarget.textContent = 'copy', 800);
                    }}>copy</button>
                    <pre class="debug-pre">{JSON.stringify(debugFacts, null, 2)}</pre>
                  </div>
                </span>
              {/if}
            {/if}
          </span>
          {#if !isCollapsed}
            {@const subFacts = getSubParamFacts(p.name)}
            {#if subFacts?.editor === 'mnemonic'}
              {#if subFacts.strategy === 'MAP'}
                <!-- MAP of mnemonic children -->
                <div class="map-entries">
                  {#each getInnerKids(p.name) as child, i (child.id)}
                    <div class="map-mnemonic-entry">
                      <div class="map-mnemonic-header">
                        <button class="entry-toggle" onclick={() => toggleEntry(child.id)}>
                          <span class="entry-arrow">{entryExpanded[child.id] ? '▼' : '▶'}</span>
                        </button>
                        {#if !entryExpanded[child.id]}
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
                      {#if entryExpanded[child.id]}
                        <svelte:self
                          param={p}
                          value={child}
                          facts={subFacts}
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
                    const placeholder = createNode('', { parameters: {} });
                    entryExpanded = { ...entryExpanded, [placeholder.id]: true };
                    setInnerChildren(p.name, [...getInnerKids(p.name), placeholder]);
                  }}>+ add entry</button>
                </div>
              {:else if subFacts.strategy === 'COLLECTION'}
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
                        insideFactory={inFactory}
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
                  facts={subFacts}
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
                facts={subFacts}
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

{#if showDocs && docsMnemonic}
  <DocsPopover
    url="/docs/autogen.md?target={docsMnemonic}"
    title={docsMnemonic}
    pinned={docsPinned}
    onclose={closeDocs}
    onmouseenter={onDocsPopoverEnter}
    onmouseleave={onDocsPopoverLeave}
  />
{/if}

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

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ddd;
    color: #777;
    font-size: 0.5rem;
    font-style: italic;
    font-family: Georgia, serif;
    font-weight: 700;
    cursor: pointer;
    line-height: 1;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.12s;
    margin-left: 0.15rem;
    vertical-align: middle;
  }

  .mnemonic-param:hover .info-icon,
  .mnemonic-header .info-icon {
    opacity: 1;
  }

  .info-icon:hover {
    background: #ccc;
    color: #444;
  }

  .debug-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-left: 0.25rem;
  }

  .debug-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #e0d4f5;
    color: #7c3aed;
    font-size: 0.5rem;
    font-weight: 700;
    cursor: help;
    vertical-align: middle;
    line-height: 1;
  }

  .debug-popover {
    display: none;
    position: fixed;
    background: #1e1e2e;
    color: #cdd6f4;
    font-size: 0.65rem;
    font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    min-width: 200px;
    max-width: 400px;
    max-height: 300px;
    overflow: auto;
  }

  .debug-pre {
    margin: 0;
    white-space: pre;
    font: inherit;
    color: inherit;
  }

  .debug-copy {
    float: right;
    margin: -0.15rem -0.2rem 0.25rem 0.5rem;
    padding: 0.15rem 0.4rem;
    border: 1px solid #555;
    border-radius: 4px;
    background: #2a2a3e;
    color: #aaa;
    font-size: 0.6rem;
    cursor: pointer;
  }

  .debug-copy:hover {
    background: #3a3a50;
    color: #ddd;
  }

  .debug-wrap:hover .debug-popover {
    display: block;
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
