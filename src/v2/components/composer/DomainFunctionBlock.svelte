<script>
    import ConfirmDeleteButton from "../ConfirmDeleteButton.svelte";
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
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
        getDragHeight,
        getDragItem,
        isDragDescendant,
        removeSource,
    } from "./dragState.js";
    import { fetchSpec, isInjectionCollection, getSpec } from "../../mnemoUtils.js";

    let { yaml = {}, ancestorParams = [], onremove = () => {} } = $props();

    // ── Mode detection ────────────────────────────────────────────────────────────

    let isCollection = $derived(Array.isArray(yaml));
    let isMap = $derived(
        !isCollection &&
        yaml != null &&
        typeof yaml === "object" &&
        !("task" in yaml) &&
        !("tasks" in yaml),
    );

    // ── Collection state ──────────────────────────────────────────────────────────

    let items = $derived(isCollection ? yaml : []);
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
            (el) => !el.classList.contains("drop-placeholder"),
        );
        if (children.length === 0) { dropIndex = 0; return; }

        let idx = children.length;
        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) { idx = i; break; }
        }

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
        if (!listEl.contains(e.relatedTarget)) dropIndex = -1;
    }

    function handleDrop(e) {
        if (e._listHandled) return;
        e._listHandled = true;
        e.preventDefault();
        const item = getDragItem();
        if (item && dropIndex >= 0) {
            const sourceIndex = items.indexOf(item);
            removeSource();
            const insertIndex = sourceIndex >= 0 && dropIndex > sourceIndex
                ? dropIndex - 1 : dropIndex;
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

    // ── Map state ─────────────────────────────────────────────────────────────────

    let entries = $derived(isMap ? Object.entries(yaml) : []);

    // ── Direct (card) state ───────────────────────────────────────────────────────

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

{#if isCollection}
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
                {ancestorParams}
                onremove={() => { yaml.splice(i, 1); }}
            />
        {/each}
        {#if dropIndex === items.length}
            <div class="drop-placeholder" style="height: {dragHeight}px"></div>
        {:else}
            <div class="drop-placeholder empty" style="height: 32px"></div>
        {/if}
    </div>
{:else if isMap}
    {#if entries.length > 0}
        <div class="map">
            {#each entries as [key, value] (key)}
                <div class="map-entry">
                    <span class="map-key">{key}</span>
                    <DomainFunctionBlock
                        yaml={value}
                        {ancestorParams}
                        onremove={() => { delete yaml[key]; }}
                    />
                </div>
            {/each}
        </div>
    {/if}
{:else if valid && taskYaml}
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
            {#each domainFunctionParams as param (param.name)}
                <div class="children" class:named={param.name !== "@delegating@"}>
                    {#if param.name !== "@delegating@"}
                        <span class="param-label">{param.name}</span>
                    {/if}
                    <div class="children-content">
                        <DomainFunctionBlock
                            yaml={getParamYaml(param)}
                            ancestorParams={[...ancestorParams, ...paramKeys]}
                            onremove={() => {
                                if (param.name === "@delegating@") {
                                    taskYaml.v = null;
                                } else {
                                    delete taskYaml.v[param.name];
                                }
                            }}
                        />
                    </div>
                </div>
            {/each}
            <DomainTaskBlock yaml={taskYaml} />
        {/if}
    </div>
{/if}

<style>
    /* ── Collection ──────────────────────────────────────────────────────────── */
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

    /* ── Map ─────────────────────────────────────────────────────────────────── */
    .map {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .map-entry {
        position: relative;
        border: 1px dashed var(--border-default);
        border-radius: 6px;
        padding: 0.5rem;
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
    }

    /* ── Direct (card) ───────────────────────────────────────────────────────── */
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
