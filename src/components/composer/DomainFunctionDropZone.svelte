<script>
    import { getDragItem, clearDragItem, removeSource } from "./dragState.js";

    let {
        height = 32,
        // passive = true: purely visual, no drag handling, controlled by `over` prop
        passive = false,
        over: overProp = false,
        // canDrop: called before accepting a drag — return false to reject
        canDrop = () => true,
        style: extraStyle = '',
        ondrop = () => {},
    } = $props();

    let isOverInternal = $state(false);
    let isOver = $derived(passive ? overProp : isOverInternal);
    let zoneEl;

    function handleDragEnter(e) {
        e._listHandled = true;
        e.preventDefault();
    }

    function handleDragOver(e) {
        if (e._listHandled || !canDrop()) {
            isOverInternal = false;
            return;
        }
        e._listHandled = true;
        e.preventDefault();
        e.dataTransfer.dropEffect = getDragItem() ? "move" : "copy";
        isOverInternal = true;
    }

    function handleDragLeave(e) {
        if (!zoneEl?.contains(e.relatedTarget)) isOverInternal = false;
    }

    function handleDrop(e) {
        if (e._listHandled || !canDrop()) return;
        e._listHandled = true;
        e.preventDefault();
        isOverInternal = false;
        const item = getDragItem();
        if (item) {
            removeSource();
            clearDragItem();
            ondrop({ item, mnemonic: null });
        } else {
            const mnemonic = e.dataTransfer.getData("text/plain");
            if (mnemonic) ondrop({ item: null, mnemonic });
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="drop-zone"
    class:over={isOver}
    style="height: {height}px; {extraStyle}"
    bind:this={zoneEl}
    ondragenter={passive ? null : handleDragEnter}
    ondragover={passive ? null : handleDragOver}
    ondragleave={passive ? null : handleDragLeave}
    ondrop={passive ? null : handleDrop}
></div>

<style>
    .drop-zone {
        border: 2px dashed var(--border-default);
        border-radius: 6px;
        background: var(--primary-subtle);
    }

    .drop-zone.over {
        border-color: var(--primary);
    }
</style>
