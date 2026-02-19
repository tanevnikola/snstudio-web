<script>
  import ProjectTree from './ProjectTree.svelte';
  import ActorDetail from './ActorDetail.svelte';
  import ServiceDetail from './ServiceDetail.svelte';
  import FunctionDetail from './FunctionDetail.svelte';
  import { project } from '../../lib/projectStore.svelte.js';
</script>

<div class="project-screen">
  <div class="tree-panel">
    <ProjectTree />
  </div>
  <div class="detail-panel" class:no-padding={!!project.selectedFunctionId}>
    {#if project.selectedFunctionId}
      <FunctionDetail functionId={project.selectedFunctionId} />
    {:else if project.selectedServiceId && project.selectedActorId}
      <ServiceDetail
        actorId={project.selectedActorId}
        serviceId={project.selectedServiceId}
      />
    {:else if project.selectedActorId}
      <ActorDetail actorId={project.selectedActorId} />
    {:else}
      <div class="empty-state">
        <span class="empty-text">Select an actor, service, or function</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .project-screen {
    display: flex;
    height: 100%;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .tree-panel {
    width: 220px;
    min-width: 160px;
    flex-shrink: 0;
    background: #f5f5f5;
    border-right: 1px solid #e0e0e0;
    overflow-y: auto;
  }

  .detail-panel {
    flex: 1;
    padding: 1.5rem 2rem;
    overflow-y: auto;
    background: white;
    min-width: 0;
  }

  .detail-panel.no-padding {
    padding: 0;
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
    color: #bbb;
  }
</style>
