<script>
  import LoadingScreen from './v2/screens/LoadingScreen.svelte';
  import HomeScreen from './v2/screens/HomeScreen.svelte';
  import ProjectScreen from './v2/screens/ProjectScreen.svelte';
  import SettingsScreen from './v2/screens/settings/SettingsScreen.svelte';
  import Icon from './v2/components/Icon.svelte';
  import { openProject, closeProject } from './v2/store/projectStore.svelte.js';

  let ready = $state(false);

  let navStack = $state([{ screen: 'home' }]);
  let current = $derived(navStack[navStack.length - 1]);
  let canGoBack = $derived(navStack.length > 1);

  function navigate(screen) {
    if (current.screen === screen) return;
    navStack = [...navStack, { screen }];
  }

  async function handleOpenProject(tag) {
    await openProject(tag);
    navStack = [...navStack, { screen: 'project', tag }];
  }

  function back() {
    const leaving = navStack[navStack.length - 1];
    if (leaving.screen === 'project') closeProject();
    if (navStack.length > 1) navStack = navStack.slice(0, -1);
  }
</script>

{#if !ready}
  <LoadingScreen onready={() => (ready = true)} />
{:else}
  <div class="app">
    <header class="topbar">
      <div class="topbar-left">
        {#if canGoBack}
          <button type="button" class="icon-btn back-btn" onclick={back} title="Back" aria-label="Go back">
            <Icon name="chevron-left" />
          </button>
        {/if}
      </div>

      <span class="app-title">SwarmNet Studio</span>

      <div class="topbar-right">
        {#if current.screen !== 'settings'}
          <button type="button" class="icon-btn" onclick={() => navigate('settings')} title="Settings" aria-label="Settings">
            <Icon name="settings" />
          </button>
        {/if}
      </div>
    </header>

    <main class="content">
      {#if current.screen === 'home'}
        <div class="screen">
          <HomeScreen onopen={handleOpenProject} />
        </div>
      {/if}

      {#if current.screen === 'project'}
        <div class="screen">
          <ProjectScreen tag={current.tag} />
        </div>
      {/if}

      {#if current.screen === 'settings'}
        <div class="screen">
          <SettingsScreen />
        </div>
      {/if}
    </main>
  </div>
{/if}

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .topbar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 0.75rem;
    height: 48px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border-default);
    flex-shrink: 0;
  }

  .topbar-left  { display: flex; align-items: center; justify-content: flex-start; }
  .topbar-right { display: flex; align-items: center; justify-content: flex-end; }

  .app-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    text-align: center;
    pointer-events: none;
    user-select: none;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .icon-btn:hover {
    background: var(--surface-3);
    color: var(--text-primary);
  }

  .back-btn {
    color: var(--text-secondary);
  }

  .content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .screen {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
