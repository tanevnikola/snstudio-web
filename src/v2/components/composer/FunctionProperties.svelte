<script>
  import { getSelectionYaml, setSelectionYaml } from './selectionState.svelte.js';
  import ObjectProperties from '../property/ObjectProperties.svelte';
  import { extractFunctionPropertiesYaml } from '../../yamlUtils.js';
  import { flush } from './dragState.js';

  let functionYaml = $derived(getSelectionYaml());
  let functionProperties = $derived(extractFunctionPropertiesYaml(functionYaml));
  function onchange(updatedProperties) {
    const sel = getSelectionYaml();
    if (!sel) return;

    const {task, tasks, ...rest} = sel;
    // sel.delete(task)
    // sel.delete(tasks)
    // Merge back only the extracted (non task/tasks) props
    Object.assign(sel, updatedProperties.v);
    // Object.assign(sel, task ? { task } : { tasks })
    setSelectionYaml({ ...sel });
    flush();
  }

  $effect(() => console.log($state.snapshot(functionProperties)))
</script>

<div class="header">
  <span class="mnemonic">DomainFunction</span>
</div>
{#key functionYaml}
  <ObjectProperties yaml={functionProperties} onchange={onchange} />
{/key}


<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-default);
    margin-bottom: 8px;
  }
  .mnemonic {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
</style>
