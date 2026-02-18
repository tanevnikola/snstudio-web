<script>
  import { project, renameService, removeService, getServiceYaml } from '../../lib/projectStore.svelte.js';
  import hljs from 'highlight.js/lib/core';
  import yamlLang from 'highlight.js/lib/languages/yaml';

  hljs.registerLanguage('yaml', yamlLang);

  let { actorId, serviceId, onOpenService } = $props();

  let actor = $derived(project.actors.find(a => a.id === actorId));
  let service = $derived(actor?.sections.services.items.find(s => s.id === serviceId));
  let yaml = $derived(getServiceYaml(actorId, serviceId));
  let yamlHtml = $derived(
    yaml ? hljs.highlight(yaml, { language: 'yaml' }).value : ''
  );

  function onNameInput(e) {
    renameService(actorId, serviceId, e.target.value);
  }
</script>

{#if service}
  <div class="service-detail">
    <label class="field">
      <span class="field-label">Name</span>
      <input class="field-input" type="text" value={service.name} oninput={onNameInput} />
    </label>

    <div class="yaml-section">
      <div class="yaml-header">
        <span class="field-label">YAML</span>
        {#if !yaml}
          <span class="yaml-empty">Not yet edited</span>
        {/if}
      </div>
      {#if yaml}
        <pre class="yaml-preview"><code>{@html yamlHtml}</code></pre>
      {/if}
    </div>

    <div class="actions">
      <button type="button" class="open-btn" onclick={() => onOpenService(actorId, serviceId)}>
        Open in Function Builder
      </button>
      <button type="button" class="delete-btn" onclick={() => removeService(actorId, serviceId)}>Delete</button>
    </div>
  </div>
{/if}

<style>
  .service-detail {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .field-input {
    padding: 0.4rem 0.6rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: inherit;
    color: #111;
    background: white;
  }

  .field-input:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 2.5px rgba(0, 122, 255, 0.18);
  }

  .yaml-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .yaml-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .yaml-empty {
    font-size: 0.75rem;
    color: #bbb;
    font-style: italic;
  }

  .yaml-preview {
    margin: 0;
    padding: 0.75rem;
    background: #1e1e2e;
    border-radius: 8px;
    overflow: auto;
    max-height: 300px;
    font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #cdd6f4;
  }

  .yaml-preview :global(.hljs-attr)    { color: #89b4fa; }
  .yaml-preview :global(.hljs-string)  { color: #a6e3a1; }
  .yaml-preview :global(.hljs-number)  { color: #fab387; }
  .yaml-preview :global(.hljs-literal) { color: #fab387; }
  .yaml-preview :global(.hljs-bullet)  { color: #94e2d5; }
  .yaml-preview :global(.hljs-comment) { color: #6c7086; font-style: italic; }

  .actions {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .open-btn {
    background: #007aff;
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.9rem;
    font-size: 0.82rem;
    font-family: inherit;
    color: white;
    cursor: pointer;
    transition: background 0.15s;
  }

  .open-btn:hover {
    background: #0066d6;
  }

  .delete-btn {
    background: none;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.82rem;
    font-family: inherit;
    color: #d32f2f;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .delete-btn:hover {
    background: rgba(211, 47, 47, 0.06);
    border-color: #d32f2f;
  }
</style>
