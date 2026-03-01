<script>
    import { deriveMapItemSpec } from "../../parameterSpecUtils";
    import { normalizeParameterValue } from "../../yamlUtils";
    import ParameterField from "./ParameterField.svelte";
    import ConfirmDeleteButton from "../ConfirmDeleteButton.svelte";

    let {
        yaml = null,
        parameterSpec = null,
        context = {},
        onchange = () => {},
    } = $props();

    let entrySpec = $derived(deriveMapItemSpec(parameterSpec));
    let keys = $derived(yaml ? Object.keys(yaml) : []);

    let collapsed = $state({});

    function handleValueChange(key, value) {
        onchange({ ...yaml, [key]: value });
    }

    function handleKeyChange(oldKey, newKey) {
        newKey = newKey.trim();
        if (!newKey || newKey === oldKey) return;
        const { [oldKey]: value, ...rest } = yaml;
        onchange({ ...rest, [newKey]: value });
    }

    function addEntry() {
        let key = "key";
        let n = 1;
        while (key in (yaml ?? {})) key = `key${n++}`;
        onchange({ ...yaml, [key]: null });
    }

    function removeEntry(key) {
        const { [key]: _, ...rest } = yaml;
        onchange(rest);
    }
</script>

<div class="map-value">
    {#each keys as key (key)}
        <div class="entry">
            <div class="entry-header">
                <ConfirmDeleteButton onclick={() => removeEntry(key)} />
                <button
                    class="collapse-toggle"
                    class:collapsed={collapsed[key]}
                    onclick={() => (collapsed[key] = !collapsed[key])}
                >
                    <span class="chevron">▼</span>
                </button>
                <input
                    type="text"
                    class="key-label"
                    placeholder="key"
                    value={key}
                    onblur={(e) =>
                        handleKeyChange(
                            key,
                            /** @type {HTMLInputElement} */ (e.target).value,
                        )}
                    onkeydown={(e) => {
                        if (e.key === "Enter")
                            /** @type {HTMLInputElement} */ (e.target).blur();
                    }}
                />
            </div>
            {#if !collapsed[key]}
                <div class="entry-value">
                    <ParameterField
                        parameterYaml={normalizeParameterValue(
                            yaml[key],
                            entrySpec,
                        )}
                        parameterSpec={entrySpec}
                        {context}
                        onchange={(value) => handleValueChange(key, value)}
                    />
                </div>
            {/if}
        </div>
    {/each}
    <button class="add-btn" onclick={addEntry}>+ add entry</button>
</div>

<style>
    .map-value {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .entry {
        display: flex;
        flex-direction: column;
        margin-bottom: 6px;
    }
    .entry-header {
        display: flex;
        align-items: center;
        gap: 2px;
        margin-bottom: 2px;
    }
    .collapse-toggle {
        background: none;
        border: none;
        padding: 0;
        font-size: 10px;
        color: var(--text-muted);
        cursor: pointer;
        line-height: 1;
        flex-shrink: 0;
    }
    .collapse-toggle:hover .chevron {
        color: var(--text-secondary);
    }
    .chevron {
        display: inline-block;
        transition: transform 0.15s ease, color 0.15s ease;
    }
    .collapse-toggle.collapsed .chevron {
        transform: rotate(-90deg);
        color: #fff;
    }
    .entry-value {
        position: relative;
        border-left: 2px dashed var(--border-default);
        padding-left: 10px;
        padding-top: 4px;
        padding-bottom: 4px;
        margin-left: 22px;
    }
    .entry-value::before,
    .entry-value::after {
        content: '';
        position: absolute;
        left: 0;
        width: 5px;
        border-color: var(--border-default);
        border-style: dashed;
    }
    .entry-value::before {
        top: 0;
        border-width: 2px 0 0 0;
    }
    .entry-value::after {
        bottom: 0;
        border-width: 0 0 2px 0;
    }
    .key-label {
        background: none;
        border: none;
        outline: none;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: text;
        padding: 0;
        min-width: 2ch;
        flex: 1;
        font-family: inherit;
    }
    .key-label:focus {
        color: var(--text-primary);
        border-bottom: 1px solid var(--primary);
    }
    .add-btn {
        align-self: flex-start;
        padding: 2px 8px;
        border: 1px dashed var(--border-default);
        border-radius: 4px;
        background: none;
        color: var(--text-secondary);
        font-size: 12px;
        cursor: pointer;
    }
    .add-btn:hover {
        border-color: var(--border-strong);
        color: var(--text-primary);
        background: var(--surface-3);
    }
</style>
