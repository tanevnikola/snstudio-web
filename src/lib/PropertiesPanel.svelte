<script>
  import { isNestedParam, getNode } from './specApi.js';
  import ParamField from './ParamField.svelte';

  let { nodeId, onchange } = $props();

  const node = getNode(nodeId);
  const isDomainFunction = node?.mnemonic === 'DomainFunction';

  // DomainFunction params (trace, metrics, verbose) — exclude declaration, nested, @delegating@
  const DF_IGNORE = new Set(['declaration', '@delegating@']);
  const dfParams = isDomainFunction
    ? Object.values(node.spec.parameters).filter(
        (p) => !isNestedParam(p) && !DF_IGNORE.has(p.name)
      )
    : [];

  // Inner task node (for DomainFunction) or self (for other nodes)
  const innerTask = isDomainFunction
    ? node.children['task']?.[0] ?? null
    : null;

  const taskNode = isDomainFunction ? innerTask : node;
  const taskParams = taskNode
    ? Object.values(taskNode.spec.parameters).filter(
        (p) => !isNestedParam(p)
      )
    : [];

  // Local reactive values — separate stores for DF and task
  let dfValues = $state(isDomainFunction ? { ...node.values } : {});
  let taskValues = $state(taskNode ? { ...taskNode.values } : {});

  // Collapsible DF section
  let dfExpanded = $state(false);

  // Sync back to registry
  $effect(() => {
    if (isDomainFunction) node.values = { ...dfValues };
  });
  $effect(() => {
    if (taskNode) taskNode.values = { ...taskValues };
  });

  function setVal(which, name, value) {
    if (which === 'df') {
      dfValues = { ...dfValues, [name]: value };
      // Write immediately to registry so card reflects changes
      node.values = { ...dfValues };
    } else {
      taskValues = { ...taskValues, [name]: value };
      if (taskNode) taskNode.values = { ...taskValues };
    }
    onchange?.();
  }
</script>

{#snippet paramField(param, which)}
  {@const store = which === 'df' ? dfValues : taskValues}
  <div class="param">
    <span class="param-name">
      {param.name}
      {#if param.required}<span class="required">*</span>{/if}
    </span>
    <span class="param-hint">{param.mnemonic}{param.injectionStrategy && param.injectionStrategy !== 'DIRECT' ? ` · ${param.injectionStrategy}` : ''}{param.injectionPoint ? ' · injectable' : ''}</span>

    <ParamField
      {param}
      value={store[param.name] ?? ''}
      onchange={(v) => setVal(which, param.name, v)}
    />
  </div>
{/snippet}

<div class="panel">
  {#if isDomainFunction && dfParams.length > 0}
    <div class="df-section">
      <button class="df-header" onclick={() => (dfExpanded = !dfExpanded)}>
        <span class="df-arrow">{dfExpanded ? '▼' : '▶'}</span>
        <span class="df-title">DomainFunction</span>
      </button>
      {#if dfExpanded}
        <div class="df-body">
          {#each dfParams as param (param.name)}
            {@render paramField(param, 'df')}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if taskNode}
    <h3>{taskNode.mnemonic}</h3>
    {#each taskParams as param (param.name)}
      {@render paramField(param, 'task')}
    {/each}
  {:else if isDomainFunction}
    <div class="no-task">No task assigned yet</div>
  {/if}
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

  .df-section {
    margin-bottom: 0.75rem;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    overflow: hidden;
  }

  .df-header {
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

  .df-header:hover {
    background: #f0f0f0;
  }

  .df-arrow {
    font-size: 0.6rem;
    color: #999;
  }

  .df-title {
    font-weight: 600;
    color: #666;
  }

  .df-body {
    padding: 0.5rem 0.75rem;
    border-top: 1px solid #e8e8e8;
  }

  .no-task {
    color: #999;
    font-size: 0.85rem;
    font-style: italic;
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
</style>
