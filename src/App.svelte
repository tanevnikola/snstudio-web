<script>
  import LoadingScreen from './lib/components/LoadingScreen.svelte';
  import FunctionBuilder from './screens/function-builder/FunctionBuilder.svelte';

  let ready = $state(false);
</script>

{#if !ready}
  <LoadingScreen onready={() => (ready = true)} />
{:else}
  <div class="app">
    <header>
      <h1>SNStudio</h1>
    </header>
    <FunctionBuilder />
  </div>
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
  }

  header {
    padding: 0.5rem 1.5rem;
    border-bottom: 1px solid #ddd;
    background: white;
  }

  h1 {
    margin: 0;
    font-size: 1.1rem;
  }
</style>
