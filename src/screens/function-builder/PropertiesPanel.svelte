<script module>
  // Shared collapse state — persists across component instances (node selections)
  let _dfExpanded = false;
  let _taskExpanded = true;
  let _v2Expanded = true;
  let _collapsed = {};
  let _entryExpanded = {};
</script>

<script>
  import { isNestedParam, getNode, createNode, unregisterDeep } from '../../lib/specApi.js';
  import { resolveParam } from '../../lib/rules.js';
  import { settings } from '../../lib/settings.svelte.js';
  import ParamField from '../../lib/components/ParamField.svelte';
  import MnemonicField from '../../lib/components/MnemonicField.svelte';
  import DocsPopover from '../../lib/components/DocsPopover.svelte';
  import ParameterField from '../../v2/components/property/ParameterField.svelte';

  let { nodeId, onchange } = $props();

  const node = getNode(nodeId);
  const isDomainFunction = node?.mnemonic === 'DomainFunction';

  // DomainFunction params — exclude nested and @delegating@
  const DF_IGNORE = new Set(['@delegating@']);
  const dfParams = isDomainFunction
    ? Object.values(node.spec.parameters)
        .filter((p) => !isNestedParam(p) && !DF_IGNORE.has(p.name))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  // Inner task node (for DomainFunction) or self (for other nodes)
  const innerTask = isDomainFunction
    ? node.children['task']?.[0] ?? null
    : null;

  const taskNode = isDomainFunction ? innerTask : node;
  const taskParams = taskNode
    ? Object.values(taskNode.spec.parameters)
        .filter((p) => !isNestedParam(p))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : [];

  // Local reactive values — separate stores for DF and task
  let dfValues = $state(isDomainFunction ? { ...node.values } : {});
  let taskValues = $state(taskNode ? { ...taskNode.values } : {});

  // Version counter to force re-derivation when children change
  let childVersion = $state(0);

  // Collapsible sections — initialized from module-level shared state
  let dfExpanded = $state(_dfExpanded);
  let taskExpanded = $state(_taskExpanded);
  let v2Expanded = $state(_v2Expanded);

  // Sync back to module-level so next instance inherits the same state
  $effect(() => { _dfExpanded = dfExpanded; });
  $effect(() => { _taskExpanded = taskExpanded; });
  $effect(() => { _v2Expanded = v2Expanded; });

  // Sync back to registry
  $effect(() => {
    if (isDomainFunction) node.values = { ...dfValues };
  });
  $effect(() => {
    if (taskNode) taskNode.values = { ...taskValues };
  });

  // Per-param collapse — initialized from module-level, synced back
  let collapsed = $state({ ..._collapsed });
  function toggleParam(name) { collapsed = { ...collapsed, [name]: !collapsed[name] }; }
  $effect(() => { _collapsed = { ...collapsed }; });

  // Per-entry expand — entries default to collapsed; explicitly expanded entries tracked here
  let entryExpanded = $state({ ..._entryExpanded });
  function toggleEntry(id) { entryExpanded = { ...entryExpanded, [id]: !entryExpanded[id] }; }
  $effect(() => { _entryExpanded = { ...entryExpanded }; });

  function setVal(which, name, value) {
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: value };
      node.values = { ...dfValues };
    } else {
      taskValues = { ...taskValues, [name]: value };
      if (taskNode) taskNode.values = { ...taskValues };
    }
    onchange?.();
  }

  function getTargetNode(which) {
    return which === 'df' ? node : taskNode;
  }

  function setChild(which, name, child) {
    const target = getTargetNode(which);
    if (!target) return;
    const old = target.children[name]?.[0];
    if (old && old !== child) unregisterDeep(old);
    target.children[name] = child ? [child] : [];
    childVersion++;
    onchange?.();
  }

  function setChildren(which, name, kids) {
    const target = getTargetNode(which);
    if (!target) return;
    target.children[name] = kids;
    childVersion++;
    onchange?.();
  }

  function bumpChildren() {
    childVersion++;
    onchange?.();
  }

  // Reactive helpers — read childVersion so Svelte tracks the dependency
  // and re-evaluates template expressions when children change structurally.
  // Unlike {#key}, this preserves DOM (no destroy/recreate → no focus loss).
  function getKids(target, name) {
    void childVersion;
    return target?.children[name] ?? [];
  }
  function getFirstChild(target, name) {
    void childVersion;
    return target?.children[name]?.[0] ?? null;
  }

  function getParamFacts(target, paramName) {
    void childVersion;
    return target ? resolveParam(target.id, paramName) : null;
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

{#snippet paramField(param, which)}
  {@const store = which === 'df' ? dfValues : taskValues}
  {@const target = getTargetNode(which)}
  {@const facts = getParamFacts(target, param.name)}
  {@const isCollapsed = collapsed[param.name]}
  <div class="param">
    <span class="param-name">
      <button class="param-toggle" onclick={() => toggleParam(param.name)}>
        <span class="param-arrow">{isCollapsed ? '▶' : '▼'}</span>
      </button>
      {param.name}
      {#if param.required}<span class="required">*</span>{/if}
    </span>
    <span class="param-hint">
      {param.mnemonic}{param.injectionStrategy && param.injectionStrategy !== 'DIRECT' ? ` · ${param.injectionStrategy}` : ''}{param.injectionPoint ? ' · injectable' : ''}
      <span class="info-icon" role="button" tabindex="-1" onmouseenter={() => onDocsEnter(param.mnemonic)} onmouseleave={onDocsLeave} onclick={(e) => onDocsClick(e, param.mnemonic)}>i</span>
      {#if settings.debug && facts}
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
            <pre class="debug-pre">{JSON.stringify(facts, null, 2)}</pre>
          </div>
        </span>
      {/if}
    </span>

    {#if !isCollapsed}
    {#if facts?.editor === 'mnemonic'}
      {#if facts.strategy === 'MAP'}
        <!-- MAP of mnemonic children -->
        <div class="map-entries">
          {#each getKids(target, param.name) as child, i (child.id)}
            <div class="map-mnemonic-entry">
              <div class="map-mnemonic-header">
                <button class="entry-toggle" onclick={() => toggleEntry(child.id)}>
                  <span class="entry-arrow">{entryExpanded[child.id] ? '▼' : '▶'}</span>
                </button>
                {#if !entryExpanded[child.id]}
                  <span class="entry-label">{child.mapKey || 'key'} <span class="entry-label-hint">({child.mnemonic || param.mnemonic})</span></span>
                {:else}
                  <input
                    type="text"
                    class="map-key"
                    placeholder="key"
                    value={child.mapKey ?? ''}
                    oninput={(e) => { child.mapKey = e.target.value; onchange?.(); }}
                  />
                {/if}
                <button class="remove-btn" onclick={() => {
                  unregisterDeep(child);
                  setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
                }}>✕</button>
              </div>
              {#if entryExpanded[child.id]}
                <MnemonicField
                  {param}
                  {facts}
                  value={child}
                  onchange={(newChild) => {
                    if (newChild && newChild !== child) {
                      newChild.mapKey = child.mapKey ?? '';
                      const kids = getKids(target, param.name);
                      const updated = [...kids];
                      updated[i] = newChild;
                      setChildren(which, param.name, updated);
                    } else if (!newChild) {
                      setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
                    } else {
                      onchange?.();
                    }
                  }}
                />
              {/if}
            </div>
          {/each}
          <button class="add-btn" onclick={() => {
            const placeholder = createNode('', { parameters: {} });
            entryExpanded = { ...entryExpanded, [placeholder.id]: true };
            setChildren(which, param.name, [...getKids(target, param.name), placeholder]);
          }}>+ add entry</button>
        </div>
      {:else if facts.strategy === 'COLLECTION'}
        <!-- COLLECTION of mnemonic children -->
        <div class="collection-entries">
          {#each getKids(target, param.name) as child, i (child.id)}
            <div class="collection-entry">
              <button class="remove-btn" onclick={() => {
                unregisterDeep(child);
                setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
              }}>✕</button>
              <MnemonicField
                {param}
                {facts}
                value={child}
                onchange={(newChild) => {
                  if (newChild && newChild !== child) {
                    const kids = getKids(target, param.name);
                    const updated = [...kids];
                    updated[i] = newChild;
                    setChildren(which, param.name, updated);
                  } else if (!newChild) {
                    setChildren(which, param.name, getKids(target, param.name).filter((_, idx) => idx !== i));
                  } else {
                    onchange?.();
                  }
                }}
              />
            </div>
          {/each}
          <button class="add-btn" onclick={() => {
            const placeholder = createNode('', { parameters: {} });
            setChildren(which, param.name, [...getKids(target, param.name), placeholder]);
          }}>+ add</button>
        </div>
      {:else}
        <!-- DIRECT mnemonic child -->
        <MnemonicField
          {param}
          {facts}
          value={getFirstChild(target, param.name)}
          onchange={(child) => setChild(which, param.name, child)}
        />
      {/if}
    {:else}
      <ParamField
        {param}
        {facts}
        value={store[param.name] ?? ''}
        onchange={(v) => setVal(which, param.name, v)}
      />
    {/if}
    {/if}
  </div>
{/snippet}

<div class="panel">
  {#if isDomainFunction && dfParams.length > 0}
    <div class="section">
      <button class="section-header" onclick={() => (dfExpanded = !dfExpanded)}>
        <span class="section-arrow">{dfExpanded ? '▼' : '▶'}</span>
        <span class="section-title">DomainFunction</span>
      </button>
      {#if dfExpanded}
        <div class="section-body">
          {#each dfParams as param (param.name)}
            {@render paramField(param, 'df')}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if taskNode}
    <div class="section">
      <button class="section-header" onclick={() => (taskExpanded = !taskExpanded)}>
        <span class="section-arrow">{taskExpanded ? '▼' : '▶'}</span>
        <span class="section-title">{taskNode.mnemonic}</span>
      </button>
      {#if taskExpanded}
        <div class="section-body">
          {#each taskParams as param (param.name)}
            {@render paramField(param, 'task')}
          {/each}
        </div>
      {/if}
    </div>
  {:else if isDomainFunction}
    <div class="no-task">No task assigned yet</div>
  {/if}

  {#if taskNode}
    <div class="section">
      <button class="section-header" onclick={() => (v2Expanded = !v2Expanded)}>
        <span class="section-arrow">{v2Expanded ? '▼' : '▶'}</span>
        <span class="section-title">V2 — {taskNode.mnemonic}</span>
      </button>
      {#if v2Expanded}
        <div class="section-body">
          {#each taskParams as param (param.name)}
            <ParameterField parameterSpec={param} />
          {/each}
        </div>
      {/if}
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
  .panel {
    padding: 1rem;
    overflow-y: auto;
  }

  .section {
    margin-bottom: 0.5rem;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: #f8f8f8;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    text-align: left;
  }

  .section-header:hover {
    background: #f0f0f0;
  }

  .section-arrow {
    font-size: 0.6rem;
    color: #999;
  }

  .section-title {
    font-weight: 600;
    color: #666;
  }

  .section-body {
    padding: 0.5rem 0.75rem;
    border-top: 1px solid #e8e8e8;
    background: #fafafa;
  }

  .no-task {
    color: #999;
    font-size: 0.85rem;
    font-style: italic;
  }

  .param {
    margin-bottom: 0.5rem;
  }

  .param:last-child {
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

  .param:hover .info-icon {
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

  .collection-entry {
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
