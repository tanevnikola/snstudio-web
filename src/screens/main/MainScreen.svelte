<script>
  import SettingsScreen from '../settings/SettingsScreen.svelte';
  import ProjectScreen from '../project/ProjectScreen.svelte';
  import ProjectsScreen from '../projects/ProjectsScreen.svelte';
  import { loadProject, unloadProject } from '../../lib/projectStore.svelte.js';

  // ── Navigation stack ────────────────────────────────────────
  // Each entry: { screen, projectId? }
  let navStack = $state([{ screen: 'projectsScreen' }]);

  let current = $derived(navStack[navStack.length - 1]);
  let canGoBack = $derived(navStack.length > 1);

  function navigate(screen) {
    if (current.screen === screen) return;
    navStack = [...navStack, { screen }];
  }

  function openProject(projectId) {
    loadProject(projectId);
    navStack = [...navStack, { screen: 'projectScreen', projectId }];
  }

  function back() {
    const leaving = navStack[navStack.length - 1];
    // Unload project data when leaving ProjectScreen
    if (leaving.screen === 'projectScreen') {
      unloadProject();
    }
    if (navStack.length > 1) navStack = navStack.slice(0, -1);
  }
</script>

<div class="main-screen">
  <header class="topbar">
    <div class="topbar-left">
      {#if canGoBack}
        <button type="button" class="icon-btn back-btn" onclick={back} title="Back" aria-label="Go back">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      {/if}
    </div>

    <span class="app-title">SNStudio</span>

    <div class="topbar-right">
      {#if current.screen !== 'settings'}
        <button type="button" class="icon-btn" onclick={() => navigate('settings')} title="Settings" aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      {/if}
    </div>
  </header>

  <main class="content">
    {#if current.screen === 'projectsScreen'}
      <div class="screen">
        <ProjectsScreen onOpenProject={openProject} />
      </div>
    {/if}

    {#if current.screen === 'projectScreen'}
      <div class="screen">
        <ProjectScreen />
      </div>
    {/if}

    {#if current.screen === 'settings'}
      <div class="screen">
        <SettingsScreen />
      </div>
    {/if}
  </main>
</div>

<style>
  .main-screen {
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
    background: white;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .topbar-left  { display: flex; align-items: center; justify-content: flex-start; }
  .topbar-right { display: flex; align-items: center; justify-content: flex-end; }

  .app-title {
    font-size: 1rem;
    font-weight: 600;
    color: #222;
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
    color: #888;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .icon-btn:hover {
    background: #f0f0f0;
    color: #333;
  }

  .back-btn {
    color: #555;
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
