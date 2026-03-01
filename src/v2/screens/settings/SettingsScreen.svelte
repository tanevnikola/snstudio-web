<script>
  import { settings, persistSettings, applyTheme } from './settings.svelte.js';
  import Icon from '../../components/Icon.svelte';

  const categories = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'codeEditor', label: 'Function Builder' },
  ];

  let selectedCategory = $state('appearance');

  function onChange() {
    persistSettings();
  }

  function onThemeChange(e) {
    settings.theme = e.target.value;
    applyTheme(settings.theme);
    persistSettings();
  }
</script>

<div class="settings-screen">
  <nav class="sidebar">
    <ul class="category-list">
      {#each categories as cat (cat.id)}
        <li>
          <button
            type="button"
            class="category-item"
            class:active={selectedCategory === cat.id}
            onclick={() => (selectedCategory = cat.id)}
          >
            {#if cat.id === 'appearance'}
              <span class="cat-icon"><Icon name="sun" size={15} /></span>
            {:else if cat.id === 'codeEditor'}
              <span class="cat-icon"><Icon name="code" size={15} /></span>
            {/if}
            <span>{cat.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <section class="panel">
    <div class="panel-content">
      {#if selectedCategory === 'appearance'}
        <h2 class="panel-title">Appearance</h2>

        <div class="settings-group">
          <div class="setting-row setting-row--inline">
            <div class="setting-label">
              <span class="setting-name">Theme</span>
              <span class="setting-desc">Choose your interface theme.</span>
            </div>
            <select class="ctrl ctrl--select-inline" value={settings.theme} onchange={onThemeChange}>
              <option value="dark">Swarmnet</option>
              <option value="zed">Zed</option>
              <option value="dusk">Dusk</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      {:else if selectedCategory === 'codeEditor'}
        <h2 class="panel-title">Function Builder</h2>

        <div class="settings-group">
          <div class="setting-row setting-row--inline">
            <div class="setting-label">
              <span class="setting-name">Max Code History</span>
              <span class="setting-desc">Number of YAML snapshots retained for undo/redo.</span>
            </div>
            <input
              class="ctrl ctrl--number"
              type="number"
              min="1"
              max="100"
              bind:value={settings.codeEditor.maxCodeHistory}
              onchange={onChange}
            />
          </div>
        </div>
      {/if}
    </div>
  </section>
</div>

<style>
  .settings-screen {
    display: flex;
    height: 100%;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--surface-2);
  }

  /* ── Sidebar ──────────────────────────────────────────────── */
  .sidebar {
    width: 190px;
    min-width: 140px;
    flex-shrink: 0;
    background: var(--surface-2);
    border-right: 1px solid var(--border-subtle);
    padding: 0.75rem 0.5rem;
    overflow-y: auto;
  }

  .category-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.4rem 0.65rem;
    border: none;
    border-radius: 6px;
    background: none;
    font-size: 0.82rem;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
    font-family: inherit;
  }

  .category-item:hover:not(.active) {
    background: var(--surface-3);
  }

  .category-item.active {
    background: var(--primary);
    color: white;
  }

  .cat-icon {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .category-item.active .cat-icon {
    opacity: 1;
  }

  /* ── Content panel ────────────────────────────────────────── */
  .panel {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
  }

  .panel-content {
    max-width: 560px;
    padding: 1.75rem 1.5rem;
  }

  .panel-title {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
  }

  /* ── Settings group (card) ────────────────────────────────── */
  .settings-group {
    background: var(--surface-3);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  /* ── Setting rows ─────────────────────────────────────────── */

  /*
   * Base row — shared padding and separator behaviour.
   * Never use alone; always pair with a layout modifier below.
   */
  .setting-row {
    padding: 0.8rem 1rem;
  }

  .settings-group .setting-row + .setting-row {
    border-top: 1px solid var(--border-subtle);
  }

  /*
   * Inline layout: label on the left, compact control on the right.
   * Best for: toggles, checkboxes, number inputs, short selects.
   * The control should carry a fixed or max-width via .ctrl--* classes.
   */
  .setting-row--inline {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .setting-row--inline .setting-label {
    flex: 1;
    min-width: 0;
  }

  /*
   * Stacked layout: label on top, full-width control below.
   * Best for: text inputs, textareas, sliders, multi-line selects.
   * The control will stretch to fill the row naturally.
   */
  .setting-row--stacked {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* ── Label parts ──────────────────────────────────────────── */
  .setting-label {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
  }

  .setting-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .setting-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* ── Controls ─────────────────────────────────────────────── */

  /* Shared base for all control elements */
  .ctrl {
    padding: 0.28rem 0.5rem;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    font-size: 0.85rem;
    color: var(--text-primary);
    background: var(--surface-1);
    font-family: inherit;
    flex-shrink: 0;
  }

  .ctrl:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2.5px var(--primary-subtle);
  }

  /* Compact number stepper */
  .ctrl--number {
    width: 68px;
    text-align: center;
  }

  /* Full-width text input (for stacked rows) */
  .ctrl--text {
    width: 100%;
    flex-shrink: unset;
  }

  /* Resizable textarea (for stacked rows) */
  .ctrl--textarea {
    width: 100%;
    flex-shrink: unset;
    resize: vertical;
    line-height: 1.5;
  }

  /* Dropdown (for stacked rows; use fixed width in inline rows) */
  .ctrl--select {
    width: 100%;
    flex-shrink: unset;
  }

  /* Compact inline select */
  .ctrl--select-inline {
    width: 120px;
  }

  /* Toggle switch */
  .ctrl--toggle {
    position: relative;
    display: inline-flex;
    cursor: pointer;
    flex-shrink: 0;
  }

  .ctrl--toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-track {
    width: 40px;
    height: 24px;
    background: var(--border-default);
    border-radius: 12px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    padding: 2px;
  }

  .ctrl--toggle input:checked + .toggle-track {
    background: var(--primary);
  }

  .toggle-thumb {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }

  .ctrl--toggle input:checked + .toggle-track .toggle-thumb {
    transform: translateX(16px);
  }
</style>
