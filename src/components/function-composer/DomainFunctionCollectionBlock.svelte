<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import DomainFunctionDropZone from "./DomainFunctionDropZone.svelte";
    import { setSelectionYaml, flush } from "./composerState.svelte.js";
    import {
        setDragHeight,
        setDragItem,
        setRemoveSource,
        clearDragItem,
        getDragHeight,
        getDragItem,
        isDragDescendant,
        removeSource,
    } from "./dragState.js";
    import {
        fetchSpec,
        isInjectionCollection,
        getSpec,
    } from "../../lib/mnemoUtils.js";

    let { yaml = [], ancestorParams = [] } = $props();

    let dropIndex = $state(-1);
    let dragHeight = $state(0);
    let listEl;

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
            (el) => !el.classList.contains("drop-zone"),
        );
        if (children.length === 0) {
            dropIndex = 0;
            return;
        }

        let idx = children.length;
        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                idx = i;
                break;
            }
        }

        const dragItem = getDragItem();
        if (dragItem) {
            const sourceIndex = yaml.indexOf(dragItem);
            if (
                sourceIndex >= 0 &&
                (idx === sourceIndex || idx === sourceIndex + 1)
            ) {
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
        if (!listEl.contains(e.relatedTarget)) dropIndex = -1;
    }

    function handleDrop(e) {
        if (e._listHandled) return;
        e._listHandled = true;
        e.preventDefault();
        const item = getDragItem();
        if (item && dropIndex >= 0) {
            const sourceIndex = yaml.indexOf(item);
            removeSource();
            const insertIndex =
                sourceIndex >= 0 && dropIndex > sourceIndex
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
                if (!getSpec(mnemonic)) fetchSpec(mnemonic);
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
    {#each yaml as item, i (i)}
        {#if dropIndex === i}
            <DomainFunctionDropZone passive over height={dragHeight} style="margin-left: 1.25rem" />
        {/if}
        <DomainFunctionBlock
            yaml={item}
            {ancestorParams}
            onremove={() => {
                yaml.splice(i, 1);
            }}
        />
    {/each}
    {#if dropIndex === yaml.length}
        <DomainFunctionDropZone passive over height={dragHeight} style="margin-left: 1.25rem" />
    {:else}
        <DomainFunctionDropZone passive style="margin-left: 1.25rem" />
    {/if}
</div>

<style>
    .list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-height: 0.5rem;
    }
</style>
