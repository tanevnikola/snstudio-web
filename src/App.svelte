<script>
  import LoadingScreen from './lib/components/LoadingScreen.svelte';
  import MainScreen from './screens/main/MainScreen.svelte';

  let ready = $state(false);
</script>

{#if !ready}
  <LoadingScreen onready={() => (ready = true)} />
{:else}
  <MainScreen />
{/if}
