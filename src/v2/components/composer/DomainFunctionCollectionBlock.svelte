<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import {
        getDragHeight,
        getDragItem,
        isDragDescendant,
        removeSource,
        clearDragItem,
    } from "./dragState.js";
    import { flush, setSelectionYaml } from "./composerState.svelte.js";
    import {
        isInjectionCollection,
        getSpec,
        fetchSpec,
    } from "../../mnemoUtils.js";
    let { yaml = [] } = $props();

    let items = $derived(Array.isArray(yaml) ? yaml : []);
    let dropIndex = $state(-1);
    let dragHeight = $state(0);
    let listEl;

    function isPaletteDrag(e) {
        return !getDragItem() && e.dataTransfer.types.includes("text/plain");
    }

    function handleDragOver(e) {
        if (e._listHandled || (getDragItem() && isDragDescendant(yaml))) {
            dropIndex = -1;
            return;
        }
        e._listHandled = true;
        e.preventDefault();
        e.dataTransfer.dropEffect = getDragItem() ? "move" : "copy";
        dragHeight = getDragItem() ? getDragHeight() : 32;

        const children = [...listEl.children].filter(
            (el) => !el.classList.contains("drop-placeholder"),
        );
        if (children.length === 0) {
            dropIndex = 0;
            return;
        }

        let idx = children.length;
        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (e.clientY < mid) {
                idx = i;
                break;
            }
        }

        // Suppress zones immediately before and after the dragged item —
        // dropping there would be a no-op (same position in the list).
        const dragItem = getDragItem();
        if (dragItem) {
            const sourceIndex = items.indexOf(dragItem);
            if (sourceIndex >= 0 && (idx === sourceIndex || idx === sourceIndex + 1)) {
                dropIndex = -1;
                return;
            }
        }

        dropIndex = idx;
    }

    function handleDragEnter(e) {
        if (e._listHandled) return;
        e._listHandled = true;
        e.preventDefault();
    }

    function handleDragLeave(e) {
        if (!listEl.contains(e.relatedTarget)) {
            dropIndex = -1;
        }
    }

    function handleDrop(e) {
        if (e._listHandled) return;
        e._listHandled = true;
        e.preventDefault();
        const item = getDragItem();
        if (item && dropIndex >= 0) {
            const sourceIndex = items.indexOf(item);
            removeSource();
            // When dragging within this collection, removing the item shifts
            // every subsequent index down by 1, so correct for that.
            const insertIndex = sourceIndex >= 0 && dropIndex > sourceIndex
                ? dropIndex - 1
                : dropIndex;
            yaml.splice(insertIndex, 0, item);
            setSelectionYaml(item);
            flush();
        } else if (!item && dropIndex >= 0) {
            const mnemonic = e.dataTransfer.getData("text/plain");
            if (mnemonic) {
                const taskV = isInjectionCollection(mnemonic) ? [] : {};
                const newItem = { task: { t: mnemonic, v: taskV } };
                yaml.splice(dropIndex, 0, newItem);
                setSelectionYaml(newItem);
                flush();
                if (!getSpec(mnemonic)) {
                    fetchSpec(mnemonic);
                }
            }
        }
        dropIndex = -1;
        clearDragItem();
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="list"
    bind:this={listEl}
    ondragenter={handleDragEnter}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
>
    {#each items as item, i (i)}
        {#if dropIndex === i}
            <div class="drop-placeholder" style="height: {dragHeight}px"></div>
        {/if}
        <DomainFunctionBlock
            yaml={item}
            onremove={() => { yaml.splice(i, 1); }}
        />
    {/each}
    {#if dropIndex === items.length}
        <div class="drop-placeholder" style="height: {dragHeight}px"></div>
    {:else}
        <div class="drop-placeholder empty" style="height: 32px"></div>
    {/if}
</div>

<style>
    .list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-height: 0.5rem;
    }

    .drop-placeholder {
        border: 2px dashed var(--primary);
        border-radius: 6px;
        background: var(--primary-subtle);
        margin-left: 1.25rem;
    }

    .drop-placeholder.empty {
        border-color: var(--border-default);
    }
</style>
