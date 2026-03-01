<script>
  import LoadingScreen from './v2/screens/LoadingScreen.svelte';
  import MainScreen from './screens/main/MainScreen.svelte';

  let ready = $state(false);
</script>

{#if !ready}
  <LoadingScreen onready={() => (ready = true)} />
{:else}
  <MainScreen />
{/if}
