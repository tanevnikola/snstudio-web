<script>
    import ConfirmDeleteButton from "../ConfirmDeleteButton.svelte";
    import DomainTaskBlock from "./DomainTaskBlock.svelte";
    import { setSelectionYaml, getSelectionYaml, flush } from "./composerState.svelte.js";
    import {
        setDragHeight,
        setDragItem,
        setRemoveSource,
        clearDragItem,
    } from "./dragState.js";
    import { fetchSpec } from "../../mnemoUtils.js";

    let {
        yaml = {},
        parent = null,
        onremove = () => {},
        selectOnMount = false,
        onAutoSelected = () => {},
    } = $props();

    let v = $derived(yaml?.v ?? yaml ?? {});
    let hasTask = $derived(v != null && typeof v === "object" && "task" in v);
    let hasTasks = $derived(v != null && typeof v === "object" && "tasks" in v);
    let valid = $derived((hasTask || hasTasks) && !(hasTask && hasTasks));

    let taskYaml = $derived.by(() => {
        if (!valid) return null;
        if (hasTask) return v.task;
        return { t: "Task.Chain", v: v.tasks };
    });

    let detail = $derived(v.trace ?? "");
    let mnemonic = $derived(taskYaml?.t ?? "");
    let mnemonicSpec = $state(null);
    let collapsed = $state(false);

    $effect(() => {
        const m = mnemonic;
        if (!m) {
            mnemonicSpec = null;
            return;
        }
        fetchSpec(m)
            .then((spec) => {
                if (mnemonic === m) mnemonicSpec = spec;
            })
            .catch(() => {
                if (mnemonic === m) mnemonicSpec = null;
            });
    });

    let domainFunctionParams = $derived.by(() => {
        if (!mnemonicSpec?.parameters) return [];
        return Object.entries(mnemonicSpec.parameters)
            .filter(([, param]) => param.mnemonic === "DomainFunction")
            .map(([name, param]) => ({ name, ...param }));
    });

    let blockEl;
    let selected = $derived(getSelectionYaml() === yaml);
    let dragging = $state(false);

    function doSelect() {
        setSelectionYaml(yaml);
    }

    function handleSelect(e) {
        e.stopPropagation();
        doSelect();
    }

    function handleDragStart(e) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/x-reorder", "");
        e.dataTransfer.setDragImage(blockEl, 0, 0);
        setDragHeight(blockEl.offsetHeight);
        setDragItem(yaml);
        setRemoveSource(onremove);
        dragging = true;
    }

    function handleDragEnd() {
        dragging = false;
        clearDragItem();
    }

    function handleDelete() {
        onremove();
        flush();
    }

    $effect(() => {
        if (selectOnMount) {
            doSelect();
            onAutoSelected();
        }
    });
</script>

{#if valid && taskYaml}
    <div
        class="task"
        class:has-children={domainFunctionParams.length > 0}
        class:collapsed
        class:dragging
    >
        <div
            class="header"
            role="button"
            tabindex="0"
            onclick={handleSelect}
            onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(e);
                }
            }}
            bind:this={blockEl}
        >
            <button
                class="collapse-btn"
                class:hidden={domainFunctionParams.length === 0}
                onclick={(e) => {
                    e.stopPropagation();
                    collapsed = !collapsed;
                }}
            >
                <span class="chevron">&#9662;</span>
            </button>
            <div
                class="block"
                style="border: 2px solid {selected
                    ? 'var(--primary)'
                    : 'var(--border-default)'}"
            >
                <div
                    class="drag-handle"
                    role="button"
                    tabindex="0"
                    draggable="true"
                    ondragstart={handleDragStart}
                    ondragend={handleDragEnd}
                    onclick={(e) => e.stopPropagation()}
                    onkeydown={(e) => e.stopPropagation()}
                >
                    &#9783;
                </div>
                <div class="delete">
                    <ConfirmDeleteButton onclick={handleDelete} />
                </div>
                <div class="info">
                    <span class="title">{mnemonic}</span>
                    {#if detail}
                        <span class="detail">{detail}</span>
                    {/if}
                </div>
            </div>
        </div>

        {#if !collapsed}
            <DomainTaskBlock yaml={taskYaml} {domainFunctionParams} />
        {/if}
    </div>
{/if}

<style>
    .task {
        position: relative;
    }

    .task.dragging {
        opacity: 0.4;
    }

    .header {
        display: flex;
        align-items: stretch;
        cursor: pointer;
    }

    .drag-handle {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        border-right: 1px solid var(--border-default);
        cursor: grab;
        color: var(--text-muted);
        font-size: 0.85rem;
        user-select: none;
    }

    .drag-handle:hover {
        color: var(--text-secondary);
        background: var(--surface-3);
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    .block {
        display: flex;
        align-items: stretch;
        background: var(--surface-2);
        border-radius: 6px;
        overflow: hidden;
        flex: 1;
        min-width: 0;
    }

    .collapse-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        flex-shrink: 0;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        color: var(--text-secondary);
        font-size: 0.7rem;
    }

    .collapse-btn.hidden {
        visibility: hidden;
    }

    .collapse-btn:hover {
        color: var(--text-primary);
    }

    .chevron {
        display: inline-block;
        transition: transform 0.15s ease;
    }

    .task.collapsed .chevron {
        transform: rotate(-90deg);
    }

    .delete {
        display: flex;
        flex-shrink: 0;
        border-right: 1px solid var(--border-default);
        padding: 0 0.4rem;
        align-items: center;
    }

    .info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
        padding: 0.5rem 0.75rem;
    }

    .title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .detail {
        font-size: 0.7rem;
        color: var(--text-secondary);
        background: var(--surface-3);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .task.has-children::after {
        content: "";
        position: absolute;
        left: 0.7rem;
        top: 100%;
        height: 0;
        width: 2px;
        background: var(--border-default);
        border-radius: 1px;
    }

    .task.has-children:not(.collapsed)::after {
        top: 2rem;
        bottom: 0;
        height: auto;
    }
</style>
