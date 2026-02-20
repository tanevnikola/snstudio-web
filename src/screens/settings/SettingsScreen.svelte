<script>
  import { settings, persistSettings } from '../../lib/settings.svelte.js';

  const categories = [
    { id: 'codeEditor', label: 'Function Builder' },
    { id: 'debug', label: 'Debug' },
  ];

  let selectedCategory = $state('codeEditor');

  function onChange() {
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
            {#if cat.id === 'codeEditor'}
              <svg class="cat-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            {:else if cat.id === 'debug'}
              <svg class="cat-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/>
                <path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1h2"/>
                <path d="M4 10h2v-1a2 2 0 0 1 2-2V6a4 4 0 0 1 4-4"/>
                <path d="M20 14h-2v1a2 2 0 0 1-2 2v1a4 4 0 0 1-4 4"/>
                <path d="M4 14h2v1a2 2 0 0 1 2 2v1a4 4 0 0 1 4 4"/>
              </svg>
            {/if}
            <span>{cat.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <section class="panel">
    <div class="panel-content">
      {#if selectedCategory === 'codeEditor'}
        <h2 class="panel-title">Function Builder</h2>

        <!--
          Inline row: label left, compact control right.
          Use for: toggles, number inputs, small selects, checkboxes.
        -->
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

        <!--
          Stacked row example (commented out — shows the pattern for future settings
          that need full-width controls like text inputs, textareas, selects with long options):

          <div class="settings-group">
            <div class="setting-row setting-row--stacked">
              <div class="setting-label">
                <span class="setting-name">Custom Header</span>
                <span class="setting-desc">Inserted at the top of every generated YAML file.</span>
              </div>
              <textarea class="ctrl ctrl--textarea" rows="3"></textarea>
            </div>
          </div>
        -->
      {:else if selectedCategory === 'debug'}
        <h2 class="panel-title">Debug</h2>

        <div class="settings-group">
          <div class="setting-row setting-row--inline">
            <div class="setting-label">
              <span class="setting-name">Debug Mode</span>
              <span class="setting-desc">Show rules engine facts on parameter labels in the properties panel.</span>
            </div>
            <label class="ctrl--toggle">
              <input
                type="checkbox"
                bind:checked={settings.debug}
                onchange={onChange}
              />
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
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
    background: #f5f5f5;
  }

  /* ── Sidebar ──────────────────────────────────────────────── */
  .sidebar {
    width: 190px;
    min-width: 140px;
    flex-shrink: 0;
    background: #ebebeb;
    border-right: 1px solid #d8d8d8;
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
    color: #333;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
    font-family: inherit;
  }

  .category-item:hover:not(.active) {
    background: #dedede;
  }

  .category-item.active {
    background: #007aff;
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
    color: #111;
    letter-spacing: -0.01em;
  }

  /* ── Settings group (card) ────────────────────────────────── */
  .settings-group {
    background: white;
    border: 1px solid #e0e0e0;
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
    border-top: 1px solid #efefef;
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
    color: #111;
  }

  .setting-desc {
    font-size: 0.75rem;
    color: #999;
    line-height: 1.4;
  }

  /* ── Controls ─────────────────────────────────────────────── */

  /* Shared base for all control elements */
  .ctrl {
    padding: 0.28rem 0.5rem;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 0.85rem;
    color: #111;
    background: #fafafa;
    font-family: inherit;
    flex-shrink: 0;
  }

  .ctrl:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 2.5px rgba(0, 122, 255, 0.18);
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
    background: #ccc;
    border-radius: 12px;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    padding: 2px;
  }

  .ctrl--toggle input:checked + .toggle-track {
    background: #007aff;
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
