<script>
    import ConfirmDeleteButton from "../ConfirmDeleteButton.svelte";
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import DomainFunctionCollectionBlock from "./DomainFunctionCollectionBlock.svelte";
    import DomainFunctionMapBlock from "./DomainFunctionMapBlock.svelte";
    import DomainFunctionSlotBlock from "./DomainFunctionSlotBlock.svelte";
    import DomainTaskBlock from "./DomainTaskBlock.svelte";
    import {
        setSelectionYaml,
        getSelectionYaml,
        flush,
    } from "./composerState.svelte.js";
    import {
        setDragHeight,
        setDragItem,
        setRemoveSource,
        clearDragItem,
        getDragItem,
    } from "./dragState.js";
    import { fetchSpec } from "../../mnemoUtils.js";

    let { yaml = {}, ancestorParams = [], onremove = () => {} } = $props();

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
        if (!m) { mnemonicSpec = null; return; }
        fetchSpec(m)
            .then((spec) => { if (mnemonic === m) mnemonicSpec = spec; })
            .catch(() => { if (mnemonic === m) mnemonicSpec = null; });
    });

    let domainFunctionParams = $derived.by(() => {
        if (!mnemonicSpec?.parameters) return [];
        return Object.entries(mnemonicSpec.parameters)
            .filter(([, param]) => param.mnemonic === "DomainFunction")
            .map(([name, param]) => ({ name, ...param }));
    });

    let paramKeys = $derived(
        v.params && typeof v.params === "object" && !Array.isArray(v.params)
            ? Object.keys(v.params)
            : [],
    );

    let paramGroups = $derived([
        ...paramKeys.filter((k) => !ancestorParams.includes(k)).map((k) => ({ k, cls: "param-new" })),
        ...paramKeys.filter((k) =>  ancestorParams.includes(k)).map((k) => ({ k, cls: "param-override" })),
        ...ancestorParams.filter((k) => !paramKeys.includes(k)).map((k) => ({ k, cls: "param-ancestor" })),
    ]);

    function getParamYaml(param) {
        if (param.name === "@delegating@") return taskYaml?.v;
        if (taskYaml?.v && param.injectionStrategy === "COLLECTION" && !Array.isArray(taskYaml.v[param.name])) {
            taskYaml.v[param.name] = [];
        }
        if (taskYaml?.v && param.injectionStrategy === "MAP" && (taskYaml.v[param.name] == null || typeof taskYaml.v[param.name] !== "object" || Array.isArray(taskYaml.v[param.name]))) {
            taskYaml.v[param.name] = {};
        }
        return taskYaml?.v?.[param.name];
    }

    let blockEl;
    let selected = $derived(getSelectionYaml() === yaml);
    let dragging = $state(false);

    function doSelect() { setSelectionYaml(yaml); }
    function handleSelect(e) { e.stopPropagation(); doSelect(); }

    function handleDragStart(e) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/x-reorder", "");
        e.dataTransfer.setDragImage(blockEl, 0, 0);
        setDragHeight(blockEl.offsetHeight);
        setDragItem(yaml);
        setRemoveSource(onremove);
        dragging = true;
        doSelect();
    }

    function handleDragEnd() { dragging = false; clearDragItem(); }
    function handleDelete() { onremove(); flush(); }
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
                onclick={(e) => { e.stopPropagation(); collapsed = !collapsed; }}
            >
                <span class="chevron">&#9662;</span>
            </button>
            <div
                class="block"
                style="border: 2px solid {selected ? 'var(--primary)' : 'var(--border-default)'}"
            >
                <div class="block-row">
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
                {#if paramGroups.length > 0}
                    <div class="params-bar">(<!--
                        -->{#each paramGroups as { k, cls }, i}<span class={cls}>{k}</span>{#if i < paramGroups.length - 1}, {/if}{/each}<!--
                    -->)</div>
                {/if}
            </div>
        </div>

        {#if !collapsed}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="children-area"
                ondragenter={(e) => { e._listHandled = true; }}
                ondragover={(e) => { e._listHandled = true; e.preventDefault(); e.dataTransfer.dropEffect = getDragItem() ? "move" : "copy"; }}
            >
            {#each domainFunctionParams as param (param.name)}
                <div class="children" class:named={param.name !== "@delegating@"}>
                    {#if param.name !== "@delegating@"}
                        <span class="param-label">{param.name}</span>
                    {/if}
                    <div class="children-content">
                        {#if param.injectionStrategy === "COLLECTION"}
                            <DomainFunctionCollectionBlock
                                yaml={getParamYaml(param)}
                                ancestorParams={[...ancestorParams, ...paramKeys]}
                            />
                        {:else if param.injectionStrategy === "MAP"}
                            <DomainFunctionMapBlock
                                yaml={getParamYaml(param)}
                                ancestorParams={[...ancestorParams, ...paramKeys]}
                            />
                        {:else}
                            <DomainFunctionSlotBlock
                                yaml={getParamYaml(param)}
                                ancestorParams={[...ancestorParams, ...paramKeys]}
                                onset={(value) => {
                                    if (param.name === "@delegating@") {
                                        taskYaml.v = value;
                                    } else {
                                        if (!taskYaml.v) taskYaml.v = {};
                                        taskYaml.v[param.name] = value;
                                    }
                                }}
                                onremove={() => {
                                    if (param.name === "@delegating@") {
                                        taskYaml.v = null;
                                    } else {
                                        delete taskYaml.v[param.name];
                                    }
                                }}
                            />
                        {/if}
                    </div>
                </div>
            {/each}
            <DomainTaskBlock yaml={taskYaml} />
            </div>
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

    .block {
        display: flex;
        flex-direction: column;
        background: var(--surface-2);
        border-radius: 6px;
        overflow: hidden;
        flex: 1;
        min-width: 0;
    }

    .block-row {
        display: flex;
        align-items: stretch;
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

    .params-bar {
        padding: 0.15rem 0.75rem;
        font-size: 0.7rem;
        color: var(--text-muted);
        border-top: 1px solid var(--border-default);
    }

    .param-new      { color: #5dab6a; }
    .param-override { color: #e8913a; }
    .param-ancestor { color: var(--text-muted); }

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

    .children {
        margin-top: 0.25rem;
        margin-left: 2rem;
    }

    .children.named + .children {
        margin-top: 0.5rem;
    }

    .children.named {
        margin-top: 0.6rem;
        position: relative;
        border: 1px dashed var(--border-default);
        border-radius: 6px;
        padding: 0.5rem;
    }

    .param-label {
        position: absolute;
        top: -0.55rem;
        left: 0.5rem;
        background: var(--surface-1);
        padding: 0 0.3rem;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--text-secondary);
    }
</style>
