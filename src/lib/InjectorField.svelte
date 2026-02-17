<script>
  import { fetchSpec, fetchConcreteInjectors, createNode, getNode, isInjectorRef, isInjectionPoint, isNestedParam, unregisterInjectorDeep } from './specApi.js';
  import ParamField from './ParamField.svelte';

  let { value, param, onchange } = $props();

  // Determine if currently in inject mode
  let injecting = $derived(isInjectorRef(value));

  // The injector node (if in inject mode)
  let injectorNode = $derived(injecting ? getNode(value.__injectorNodeId) : null);

  // Stash the literal value so it can be restored when leaving inject mode
  let stashedLiteral = $state(null);

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
    return Object.values(injectorNode.spec.parameters).filter(
      (p) => !isNestedParam(p) && p.name !== '@delegating@'
    );
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
    // Trigger parent re-render by re-emitting same ref
    onchange({ ...value });
  }

  // Literal value helper
  function getLiteralValue() {
    if (injecting) return '';
    return value ?? '';
  }
</script>

<div class="injector-field">
  {#if injecting}
    <!-- Inject mode: toggle + type picker -->
    <div class="field-row">
      <button
        class="inject-toggle active"
        onclick={toggleInject}
        title="Switch to literal value"
      >&#x26A1;</button>
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
    </div>

    <!-- Injector params (inline expanded) -->
    {#if injectorNode}
      <div class="injector-params">
        {#if hasDelegating}
          <!-- @delegating@ — single value field, no label -->
          {@const dp = injectorNode.spec.parameters['@delegating@']}
          <ParamField
            param={dp}
            value={injectorValues['@delegating@'] ?? ''}
            onchange={(v) => setInjectorParam('@delegating@', v)}
          />
        {/if}

        {#each injectorParams as ip (ip.name)}
          <div class="injector-param">
            <span class="ip-label">{ip.name}{#if ip.injectionStrategy && ip.injectionStrategy !== 'DIRECT'} · {ip.injectionStrategy}{/if}</span>
            <ParamField
              param={ip}
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
          value={getLiteralValue()}
          onchange={(v) => onchange(v)}
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .injector-field {
    flex: 1;
    min-width: 0;
  }

  .field-row {
    display: flex;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .inject-toggle {
    background: none;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0.2rem 0.35rem;
    font-size: 0.7rem;
    cursor: pointer;
    flex-shrink: 0;
    color: #aaa;
    line-height: 1;
    margin-top: 0.2rem;
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
</style>
