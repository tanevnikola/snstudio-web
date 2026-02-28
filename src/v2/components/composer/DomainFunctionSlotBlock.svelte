<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import { setSelectionYaml, flush } from "./composerState.svelte.js";
    import { getDragItem, clearDragItem, removeSource } from "./dragState.js";
    import { fetchSpec, isInjectionCollection, getSpec } from "../../mnemoUtils.js";

    let { yaml = null, ancestorParams = [], onset = () => {}, onremove = () => {} } = $props();

    let hasValue = $derived(
        yaml != null && typeof yaml === "object" && ("task" in yaml || "tasks" in yaml),
    );

    let isOver = $state(false);
    let slotEl;

    function handleDragOver(e) {
        e._listHandled = true;
        e.preventDefault();
        e.dataTransfer.dropEffect = getDragItem() ? "move" : "copy";
        isOver = true;
    }

    function handleDragEnter(e) {
        e._listHandled = true;
        e.preventDefault();
    }

    function handleDragLeave(e) {
        if (!slotEl?.contains(e.relatedTarget)) isOver = false;
    }

    function handleDrop(e) {
        e._listHandled = true;
        e.preventDefault();
        isOver = false;
        const item = getDragItem();
        if (item) {
            removeSource();
            onset(item);
            setSelectionYaml(item);
            clearDragItem();
            flush();
        } else {
            const mnemonic = e.dataTransfer.getData("text/plain");
            if (mnemonic) {
                const taskV = isInjectionCollection(mnemonic) ? [] : {};
                onset({ task: { t: mnemonic, v: taskV } });
                if (!getSpec(mnemonic)) fetchSpec(mnemonic);
                flush();
            }
        }
    }
</script>

{#if hasValue}
    <DomainFunctionBlock {yaml} {ancestorParams} {onremove} />
{:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="slot-empty"
        class:over={isOver}
        bind:this={slotEl}
        ondragenter={handleDragEnter}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
    ></div>
{/if}

<style>
    .slot-empty {
        height: 32px;
        border: 2px dashed var(--border-default);
        border-radius: 6px;
        margin-left: 1.25rem;
    }

    .slot-empty.over {
        border-color: var(--primary);
        background: var(--primary-subtle);
    }
</style>
