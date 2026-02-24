<script>
  import { fetchSpec, fetchConcreteInjectors, createNode, getNode, isInjectorRef, isNestedParam, unregisterInjectorDeep } from '../specApi.js';
  import { resolveParam } from '../rules.js';
  import { settings } from '../settings.svelte.js';
  import ParamField from './ParamField.svelte';
  import DocsPopover from '../../v2/components/DocsPopover.svelte';

  let { value, param, onchange, injectOnly = false } = $props();

  // Determine if currently in inject mode
  let injecting = $derived(isInjectorRef(value));

  // The injector node (if in inject mode)
  let injectorNode = $derived(injecting ? getNode(value.__injectorNodeId) : null);

  // Stash the literal value so it can be restored when leaving inject mode
  let stashedLiteral = $state(null);

  // Auto-enter inject mode for inject-only params
  $effect(() => {
    if (injectOnly && !injecting) {
      loadInjectorTypes();
      onchange({ __injectorNodeId: null });
    }
  });

  // Concrete injector types (loaded lazily)
  let injectorTypes = $state([]);
  let injectorTypesLoading = $state(false);

  async function loadInjectorTypes() {
    if (injectorTypes.length > 0) return;
    injectorTypesLoading = true;
    try {
      injectorTypes = await fetchConcreteInjectors();
    } catch (e) {
      console.error('Failed to load injector types:', e);
    } finally {
      injectorTypesLoading = false;
    }
  }

  // If we mount already in inject mode (e.g. from YAML paste), load the type list immediately
  $effect(() => {
    if (injecting) {
      loadInjectorTypes();
    }
  });

  function toggleInject() {
    if (injectOnly) return; // Cannot switch to literal for inject-only params
    if (injecting) {
      // Switch to literal — remove injector node, restore stashed value
      unregisterInjectorDeep(value.__injectorNodeId);
      onchange(stashedLiteral ?? '');
    } else {
      // Switch to inject — stash current literal value, then enter inject mode
      stashedLiteral = value;
      loadInjectorTypes();
      onchange({ __injectorNodeId: null }); // placeholder, no node yet
    }
  }

  async function selectInjectorType(mnemonic) {
    if (!mnemonic) {
      // Cleared selection — remove existing node if any
      if (value?.__injectorNodeId) {
        unregisterInjectorDeep(value.__injectorNodeId);
      }
      onchange({ __injectorNodeId: null });
      return;
    }
    // Remove old injector node if switching types
    if (value?.__injectorNodeId) {
      unregisterInjectorDeep(value.__injectorNodeId);
    }
    const spec = await fetchSpec(mnemonic);
    const node = createNode(mnemonic, spec);
    onchange({ __injectorNodeId: node.id });
  }

  // Get injector's non-nested params, excluding @delegating@ from the regular loop
  let injectorParams = $derived.by(() => {
    if (!injectorNode) return [];
    return Object.values(injectorNode.spec.parameters)
      .filter((p) => !isNestedParam(p) && p.name !== '@delegating@')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  let hasDelegating = $derived(injectorNode?.spec.parameters['@delegating@'] != null);

  // Reactive snapshot of injector values — keeps Svelte in the loop for nested fields
  let injectorValues = $state({});

  // Re-snapshot when injector node changes (new selection, or parent re-renders)
  $effect(() => {
    if (injectorNode) {
      injectorValues = { ...injectorNode.values };
    } else {
      injectorValues = {};
    }
  });

  // Update an injector param value
  function setInjectorParam(paramName, newVal) {
    if (!injectorNode) return;
    injectorValues = { ...injectorValues, [paramName]: newVal };
    injectorNode.values = { ...injectorValues };
    injectorVersion++;
    // Trigger parent re-render by re-emitting same ref
    onchange({ ...value });
  }

  // Version counter for reactivity on injector param changes
  let injectorVersion = $state(0);

  function getInjectorParamFacts(paramName) {
    void injectorVersion;
    return injectorNode ? resolveParam(injectorNode.id, paramName) : null;
  }

  // Build literal-mode facts from the parent param's literalType
  // (so ParamField knows to render boolean/enum/text without injection toggle)
  let literalFacts = $derived.by(() => {
    if (!param) return null;
    // Resolve parent facts to get literalType
    // For literal mode, we need a simple facts object
    return {
      editor: param.mnemonic === 'Boolean' ? 'boolean' : 'text',
      literalType: null,
      strategy: 'DIRECT',
      canMultiline: ['String', 'Object'].includes(param.mnemonic),
      enumValues: [],
      concretes: [],
      required: false,
      defaultValue: param.defaultValue ?? null,
      mnemonic: param.mnemonic ?? '',
    };
  });

  // Literal value helper
  function getLiteralValue() {
    if (injecting) return '';
    return value ?? '';
  }

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

<div class="injector-field">
  {#if injecting}
    <!-- Inject mode: toggle + type picker -->
    <div class="field-row">
      {#if !injectOnly}
        <button
          class="inject-toggle active"
          onclick={toggleInject}
          title="Switch to literal value"
        >&#x26A1;</button>
      {/if}
      <div class="select-with-icon">
        <select
          class="injector-select"
          value={injectorNode?.mnemonic ?? ''}
          onchange={(e) => selectInjectorType(e.target.value)}
        >
          <option value="">-- select injector --</option>
          {#each injectorTypes as type (type)}
            <option value={type}>{type}</option>
          {/each}
        </select>
        {#if injectorNode}
          <span class="info-icon" role="button" tabindex="-1" onmouseenter={() => onDocsEnter(injectorNode.mnemonic)} onmouseleave={onDocsLeave} onclick={(e) => onDocsClick(e, injectorNode.mnemonic)}>i</span>
        {/if}
      </div>
    </div>

    <!-- Injector params (inline expanded) -->
    {#if injectorNode}
      <div class="injector-params">
        {#if hasDelegating}
          <!-- @delegating@ — single value field, no label -->
          {@const dp = injectorNode.spec.parameters['@delegating@']}
          <ParamField
            param={dp}
            facts={getInjectorParamFacts('@delegating@')}
            value={injectorValues['@delegating@'] ?? ''}
            onchange={(v) => setInjectorParam('@delegating@', v)}
          />
        {/if}

        {#each injectorParams as ip (ip.name)}
          {@const ipFacts = getInjectorParamFacts(ip.name)}
          <div class="injector-param">
            <span class="ip-label">
              {ip.name}{#if ip.injectionStrategy && ip.injectionStrategy !== 'DIRECT'} · {ip.injectionStrategy}{/if}
              <span class="info-icon" role="button" tabindex="-1" onmouseenter={() => onDocsEnter(ip.mnemonic)} onmouseleave={onDocsLeave} onclick={(e) => onDocsClick(e, ip.mnemonic)}>i</span>
              {#if settings.debug && ipFacts}
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
                    document.querySelectorAll('.debug-popover[data-pinned="1"]').forEach(el => {
                      el.dataset.pinned = '';
                      el.style.display = '';
                    });
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
                    <pre class="debug-pre">{JSON.stringify(ipFacts, null, 2)}</pre>
                  </div>
                </span>
              {/if}
            </span>
            <ParamField
              param={ip}
              facts={ipFacts}
              value={injectorValues[ip.name] ?? ''}
              onchange={(v) => setInjectorParam(ip.name, v)}
            />
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <!-- Literal mode: toggle + ParamField for the value -->
    <div class="field-row">
      <button
        class="inject-toggle"
        onclick={toggleInject}
        title="Use resource injector"
      >&#x26A1;</button>
      <div class="literal-value">
        <ParamField
          param={{ ...param, injectionPoint: false }}
          facts={literalFacts}
          value={getLiteralValue()}
          onchange={(v) => onchange(v)}
        />
      </div>
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
  .injector-field {
    flex: 1;
    min-width: 0;
  }

  .field-row {
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .inject-toggle {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 0.75rem;
    cursor: pointer;
    flex-shrink: 0;
    color: #bbb;
    line-height: 1;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .inject-toggle:hover {
    border-color: #999;
    color: #666;
  }

  .inject-toggle.active {
    background: #e8f0fe;
    border-color: #4a90d9;
    color: #4a90d9;
  }

  .injector-select {
    flex: 1;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: inherit;
    background: white;
    min-width: 0;
  }

  .injector-select:focus {
    outline: none;
    border-color: #666;
  }

  .literal-value {
    flex: 1;
    min-width: 0;
  }

  .injector-params {
    margin-top: 0.3rem;
    margin-left: 1.2rem;
    padding-left: 0.5rem;
    border-left: 2px solid #d0d7e8;
  }

  .injector-param {
    margin-bottom: 0.4rem;
  }

  .ip-label {
    font-size: 0.7rem;
    color: #888;
    display: block;
    margin-bottom: 0.1rem;
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

  .injector-param:hover .info-icon {
    opacity: 1;
  }

  .select-with-icon {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .select-with-icon select {
    width: 100%;
    padding-right: 2rem;
  }

  .select-with-icon .info-icon {
    position: absolute;
    right: 1.4rem;
    top: 50%;
    transform: translateY(-50%);
    opacity: 1;
    margin-left: 0;
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
</style>
