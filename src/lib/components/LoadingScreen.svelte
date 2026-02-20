<script>
  import { loadAllSpecs } from '../specLoader.js';

  let { onready } = $props();

  let loaded = $state(0);
  let total = $state(0);
  let error = $state(null);

  $effect(() => {
    loadAllSpecs(undefined, (l, t) => {
      loaded = l;
      total = t;
    })
      .then(() => onready?.())
      .catch((e) => {
        error = e.message;
      });
  });
</script>

<div class="loading-screen">
  <div class="content">
    <h1 class="title">SNStudio</h1>
    {#if error}
      <div class="error">
        <p>Failed to load specifications</p>
        <p class="error-detail">{error}</p>
        <button class="retry-btn" onclick={() => location.reload()}>Retry</button>
      </div>
    {:else}
      <div class="progress-area">
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: {total > 0 ? (loaded / total) * 100 : 0}%"
          ></div>
        </div>
        <p class="progress-text">
          Loading specs{#if total > 0}... ({loaded}/{total}){/if}
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #fafafa;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .content {
    text-align: center;
    width: 320px;
  }

  .title {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin: 0 0 2rem 0;
  }

  .progress-area {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-bar {
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #4a90d9;
    border-radius: 2px;
    transition: none;
  }

  .progress-text {
    font-size: 0.85rem;
    color: #888;
    margin: 0;
  }

  .error {
    color: #d32f2f;
  }

  .error p {
    margin: 0.25rem 0;
  }

  .error-detail {
    font-size: 0.8rem;
    color: #888;
  }

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .retry-btn:hover {
    background: #f5f5f5;
  }
</style>
