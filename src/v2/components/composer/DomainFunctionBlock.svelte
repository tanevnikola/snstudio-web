<script>
  import DomainTaskBlock from './DomainTaskBlock.svelte';

  let { yaml = {} } = $props();

  let v = $derived(yaml?.v ?? yaml ?? {});
  let hasTask = $derived(v != null && typeof v === 'object' && 'task' in v);
  let hasTasks = $derived(v != null && typeof v === 'object' && 'tasks' in v);
  let valid = $derived((hasTask || hasTasks) && !(hasTask && hasTasks));

  let taskYaml = $derived.by(() => {
    if (!valid) return null;
    if (hasTask) return v.task;
    return { t: 'Task.Chain', v: v.tasks };
  });

  let detail = $derived(v.trace ?? '');
</script>

{#if valid && taskYaml}
  <DomainTaskBlock yaml={taskYaml} {detail} />
{/if}
