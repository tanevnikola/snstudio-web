<script>
  import jsYaml from 'js-yaml';
  import { fetchSpec } from '../../../lib/specApi.js';
  import { getSelectionYaml, isDirty, clearDirty } from '../composer/selectionState.svelte.js';
  import { flush } from '../composer/dragState.js';
  import ParameterField from './ParameterField.svelte';
  import YamlContainer from '../YamlContainer.svelte';

  let yaml = $derived(getSelectionYaml());

  let mnemonic = $derived(yaml?.tasks ? 'Task.Chain' : yaml?.task?.t ?? null);
  let taskYaml = $derived(yaml?.task ?? (yaml?.tasks ? { t: 'Task.Chain', v: yaml.tasks } : null));
  let spec = $state(null);

  $effect(() => {
    const m = mnemonic;
    if (!m) { spec = null; return; }
    fetchSpec(m).then(s => {
      if (mnemonic === m) spec = s;
    }).catch(() => {
      if (mnemonic === m) spec = null;
    });
  });

  let params = $derived.by(() => {
    if (!spec?.parameters) return [];
    return Object.entries(spec.parameters)
      .filter(([, p]) => p.mnemonic !== 'DomainFunction')
      .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
      .map(([name, p]) => ({ name, ...p }));
  });

  let dirty = $derived(isDirty());
  let taskYamlText = $derived(taskYaml ? jsYaml.dump(taskYaml, { lineWidth: -1, noRefs: true }) : '');

  function handleSave() {
    flush();
    clearDirty();
  }
</script>

{#if mnemonic}
  <div class="header">
    <span class="mnemonic">{mnemonic}</span>
    <button class="save-btn" class:dirty disabled={!dirty} onclick={handleSave}>Save</button>
  </div>
  <div class="params">
    {#each params as param (param.name)}
      <ParameterField yaml={taskYaml} parameterSpec={param} />
    {/each}
  </div>
  <YamlContainer yamlText={taskYamlText} collapsed={true} canEdit={false} style="max-height: 450px" />
{/if}

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 8px;
  }
  .mnemonic {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
  .save-btn {
    padding: 4px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    font-size: 12px;
    cursor: not-allowed;
    color: #999;
  }
  .save-btn.dirty {
    background: #4a90d9;
    border-color: #3a7bc8;
    color: white;
    cursor: pointer;
  }
  .save-btn.dirty:hover {
    background: #3a7bc8;
  }
  .params {
    padding: 8px 12px;
  }
</style>
