<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import DomainFunctionDropZone from "./DomainFunctionDropZone.svelte";
    import { setSelectionYaml, flush } from "./composerState.svelte.js";
    import { getDragItem, isDragDescendant } from "./dragState.js";
    import { fetchSpec, isInjectionCollection, getSpec } from "../../lib/mnemoUtils.js";

    let { yaml = {}, ancestorParams = [] } = $props();

    let entries = $derived(Object.entries(yaml));

    function uniqueKey(base) {
        let key = base;
        let n = 1;
        while (key in yaml) key = `${base}${n++}`;
        return key;
    }

    function mnemonicToKey(mnemonic) {
        const last = mnemonic.split(".").at(-1) ?? "item";
        return last.charAt(0).toLowerCase() + last.slice(1);
    }

    function handleDrop({ item, mnemonic }) {
        if (item) {
            const key = uniqueKey(mnemonicToKey(item?.task?.t ?? "item"));
            yaml[key] = item;
            setSelectionYaml(item);
        } else if (mnemonic) {
            const taskV = isInjectionCollection(mnemonic) ? [] : {};
            const newItem = { task: { t: mnemonic, v: taskV } };
            const key = uniqueKey(mnemonicToKey(mnemonic));
            yaml[key] = newItem;
            setSelectionYaml(newItem);
            if (!getSpec(mnemonic)) fetchSpec(mnemonic);
        }
        flush();
    }

    function renameKey(oldKey, newKey) {
        newKey = newKey.trim();
        if (!newKey || newKey === oldKey || newKey in yaml) return;
        const value = yaml[oldKey];
        delete yaml[oldKey];
        yaml[newKey] = value;
        flush();
    }
</script>

<div class="map">
    {#each entries as [key, value] (key)}
        <div class="map-entry">
            <input
                class="map-key"
                value={key}
                size={Math.max(key.length, 3)}
                onblur={(e) => renameKey(key, e.currentTarget.value)}
                onkeydown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                }}
                onclick={(e) => e.stopPropagation()}
            />
            <DomainFunctionBlock
                yaml={value}
                {ancestorParams}
                onremove={() => {
                    delete yaml[key];
                }}
            />
        </div>
    {/each}
    <DomainFunctionDropZone
        canDrop={() => !getDragItem() || !isDragDescendant(yaml)}
        ondrop={handleDrop}
    />
</div>

<style>
    .map {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-height: 0.5rem;
    }

    .map-entry {
        position: relative;
        border: 1px dashed var(--border-default);
        border-radius: 6px;
        padding: 0.5rem;
        margin-top: 0.4rem;
    }

    .map-key {
        position: absolute;
        top: -0.55rem;
        left: 0.5rem;
        background: var(--surface-1);
        padding: 0 0.3rem;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--text-secondary);
        border: none;
        outline: none;
        cursor: text;
        font-family: inherit;
        min-width: 2rem;
    }

    .map-key:focus {
        color: var(--text-primary);
        background: var(--surface-2);
        border-radius: 2px;
        outline: 1px solid var(--primary);
    }
</style>
