<script>
    import { deriveMapItemSpec } from "../../parameterSpecUtils";
    import { normalizeParameterValue } from "../../yamlUtils";
    import ParameterField from "./ParameterField.svelte";

    let {
        yaml = null,
        parameterSpec = null,
        context = {},
        onchange = () => {},
    } = $props();

    let entrySpec = $derived(deriveMapItemSpec(parameterSpec));
    let keys = $derived(yaml ? Object.keys(yaml) : []);

    function handleValueChange(key, value) {
        onchange({ ...yaml, [key]: value });
    }

    function handleKeyChange(oldKey, newKey) {
        if (oldKey === newKey) return;
        const { [oldKey]: value, ...rest } = yaml;
        onchange({ ...rest, [newKey]: value });
    }

    function addEntry() {
        onchange({ ...yaml, "": null });
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
                <button
                    class="remove-btn"
                    onclick={() => removeEntry(key)}
                    title="Remove entry">&times;</button
                >
                <input
                    type="text"
                    class="key-input"
                    placeholder="key"
                    value={key}
                    onblur={(e) =>
                        handleKeyChange(
                            key,
                            /** @type {HTMLInputElement} */ (e.target).value,
                        )}
                />
            </div>
            <ParameterField
                parameterYaml={normalizeParameterValue(yaml[key], entrySpec)}
                parameterSpec={entrySpec}
                {context}
                onchange={(value) => handleValueChange(key, value)}
            />
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
        padding: 8px;
        border: 1px solid var(--border-default);
        border-radius: 6px;
        background: var(--surface-2);
    }
    .entry-header {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 4px;
    }
    .key-input {
        flex: 1;
        min-width: 0;
        padding: 4px 8px;
        border: 1px solid var(--border-default);
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
        background: var(--surface-2);
        color: var(--text-primary);
    }
    .key-input:focus {
        outline: none;
        border-color: var(--primary);
    }
    .remove-btn {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: none;
        color: var(--text-muted);
        font-size: 16px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    .remove-btn:hover {
        background: var(--danger-subtle);
        color: var(--danger);
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
