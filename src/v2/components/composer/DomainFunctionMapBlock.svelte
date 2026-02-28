<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import { setSelectionYaml, flush } from "./composerState.svelte.js";
    import {
        getDragItem,
        clearDragItem,
        removeSource,
        isDragDescendant,
    } from "./dragState.js";
    import { fetchSpec, isInjectionCollection, getSpec } from "../../mnemoUtils.js";

    let { yaml = {}, ancestorParams = [] } = $props();

    let entries = $derived(Object.entries(yaml));
    let isOver = $state(false);
    let mapEl;

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

    function handleDragOver(e) {
        if (e._listHandled || (getDragItem() && isDragDescendant(yaml))) {
            isOver = false;
            return;
        }
        e._listHandled = true;
        e.preventDefault();
        e.dataTransfer.dropEffect = getDragItem() ? "move" : "copy";
        isOver = true;
    }

    function handleDragLeave(e) {
        if (!mapEl?.contains(e.relatedTarget)) isOver = false;
    }

    function handleDragEnter(e) {
        if (e._listHandled) return;
        e._listHandled = true;
        e.preventDefault();
    }

    function handleDrop(e) {
        if (e._listHandled) return;
        e._listHandled = true;
        e.preventDefault();
        isOver = false;
        const item = getDragItem();
        if (item) {
            removeSource();
            const mnemonic = item?.task?.t ?? "item";
            const key = uniqueKey(mnemonicToKey(mnemonic));
            yaml[key] = item;
            setSelectionYaml(item);
            clearDragItem();
            flush();
        } else {
            const mnemonic = e.dataTransfer.getData("text/plain");
            if (mnemonic) {
                const taskV = isInjectionCollection(mnemonic) ? [] : {};
                const newItem = { task: { t: mnemonic, v: taskV } };
                const key = uniqueKey(mnemonicToKey(mnemonic));
                yaml[key] = newItem;
                setSelectionYaml(newItem);
                if (!getSpec(mnemonic)) fetchSpec(mnemonic);
                flush();
            }
        }
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="map"
    bind:this={mapEl}
    ondragenter={handleDragEnter}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
>
    {#each entries as [key, value] (key)}
        <div class="map-entry">
            <input
                class="map-key"
                value={key}
                size={Math.max(key.length, 3)}
                onblur={(e) => renameKey(key, e.currentTarget.value)}
                onkeydown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                onclick={(e) => e.stopPropagation()}
            />
            <DomainFunctionBlock
                yaml={value}
                {ancestorParams}
                onremove={() => { delete yaml[key]; }}
            />
        </div>
    {/each}
    <div class="drop-placeholder" class:over={isOver}></div>
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

    .drop-placeholder {
        height: 32px;
        border: 2px dashed var(--border-default);
        border-radius: 6px;
        background: var(--primary-subtle);
        margin-top: 0.25rem;
    }

    .drop-placeholder.over {
        border-color: var(--primary);
        background: var(--primary-subtle);
    }
</style>
