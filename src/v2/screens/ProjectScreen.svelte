<script>
  import ActorTree from '../components/project/ActorTree.svelte';
  import FunctionTree from '../components/project/FunctionTree.svelte';
  import FunctionBuilderScreen from './FunctionBuilderScreen.svelte';
  import { selection, project } from '../store/projectStore.svelte.js';
  import jsYaml from 'js-yaml';

  let { tag } = $props();

  let selectedFn = $derived(
    selection.functionScope === 'project' && selection.functionName
      ? project.functions[selection.functionName]
      : null
  );

  let fnYaml = $derived(
    selectedFn?.yaml ? jsYaml.dump(selectedFn.yaml) : ''
  );
</script>

<div class="project-screen">
  <aside class="tree-panel">
    <ActorTree />
    <FunctionTree />
  </aside>

  <main class="detail-panel" class:no-padding={!!selectedFn}>
    {#if selectedFn}
      <FunctionBuilderScreen yaml={fnYaml} />
    {:else}
      <div class="empty-state">
        <span class="empty-text">Select an actor or function</span>
      </div>
    {/if}
  </main>
</div>

<style>
  .project-screen {
    display: flex;
    height: 100%;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.82rem;
    user-select: none;
  }

  /* ── Tree panel ──────────────────────────────────────────── */

  .tree-panel {
    width: 210px;
    min-width: 150px;
    flex-shrink: 0;
    background: var(--surface-2);
    border-right: 1px solid var(--border-default);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 0.4rem 0;
    gap: 0.5rem;
  }

  /* ── Detail panel ────────────────────────────────────────── */

  .detail-panel {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    background: var(--surface-1);
  }

  .detail-panel.no-padding {
    overflow: hidden;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-text {
    font-size: 0.85rem;
    color: var(--text-muted);
  }
</style>
