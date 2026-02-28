<script>
    import {
        getSpec,
        fetchSpec,
        getImplementations,
        getObjectProperties,
        isImplementing,
    } from "../../mnemoUtils.js";
    import ParameterField from "./ParameterField.svelte";
    import DocsPopover from "../DocsPopover.svelte";
    import Self from "./MnemonicValue.svelte";
    import { extractParameterYaml } from "../../yamlUtils.js";
    import { untrack } from "svelte";

    let { yaml, mnemonic, onchange = () => {}, context = {} } = $props();

    let mnemonicSpec = $state(null);
    let implementations = $derived(
        mnemonicSpec ? getImplementations(mnemonic) : [],
    );
    let selectedMnemonic = $state(null);

    function handleImplementationChange(e) {
        selectedMnemonic =
            /** @type {HTMLSelectElement} */ (e.target).value || null;
        onchange({ t: selectedMnemonic });
    }

    /**
     * Handle parameters
     */
    let params = $derived(getObjectProperties(mnemonicSpec));

    /**
     * Documentation stuff
     */
    let showDocs = $state(false);
    let docsPinned = $state(false);
    let docsHoverTimer = null;
    let docsMnemonic = $derived(selectedMnemonic ?? mnemonic);

    function onDocsEnter() {
        clearTimeout(docsHoverTimer);
        if (!docsPinned) showDocs = true;
    }

    function onDocsLeave() {
        if (!docsPinned) {
            docsHoverTimer = setTimeout(() => {
                showDocs = false;
            }, 200);
        }
    }

    function onDocsPopoverEnter() {
        clearTimeout(docsHoverTimer);
    }

    function onDocsPopoverLeave() {
        if (!docsPinned) {
            docsHoverTimer = setTimeout(() => {
                showDocs = false;
            }, 200);
        }
    }

    function onDocsClick(e) {
        e.stopPropagation();
        e.preventDefault();
        docsPinned = true;
        showDocs = true;
    }

    function closeDocs() {
        showDocs = false;
        docsPinned = false;
        clearTimeout(docsHoverTimer);
    }

    $effect(() => {
        const cached = getSpec(mnemonic);
        if (cached) {
            mnemonicSpec = cached;
        } else {
            fetchSpec(mnemonic).then((fetched) => {
                mnemonicSpec = fetched;
            });
        }
        untrack(() => {
            if (
                isImplementing(yaml.t, mnemonic) ||
                (yaml.t != "Object" && mnemonic === "Object")
            ) {
                selectedMnemonic = yaml.t;
            }
        });
    });

    let childContext = $derived({
        ...context,
        isWithinFactory:
            context.isFactory === true || context.isWithinFactory === true,
    });

    function parameterChange(paramName, value) {
        if (paramName === "@delegating@") {
            onchange({ ...yaml, v: value });
        } else {
            onchange({ ...yaml, v: { ...yaml.v, [paramName]: value } });
        }
    }

    function handleFactoryChange(paramName, isFactory) {
        if (isFactory && yaml.v?.[paramName]) {
            // Rename v to factory
            const { [paramName]: paramVal, ...restV } = yaml.v;
            const newFactory = { ...yaml.factory, [paramName]: paramVal };
            const newV = Object.keys(restV).length > 0 ? restV : undefined;
            onchange({ ...yaml, v: newV, factory: newFactory });
        } else if (!isFactory && yaml.factory?.[paramName]) {
            // Rename factory to v
            const { [paramName]: paramVal, ...restFactory } = yaml.factory;
            const newV = { ...yaml.v, [paramName]: paramVal };
            const newFactory =
                Object.keys(restFactory).length > 0 ? restFactory : undefined;
            onchange({ ...yaml, v: newV, factory: newFactory });
        }
    }

    function nestedMnemonicChange(value) {
        onchange(value);
    }
</script>

<div class="mnemonic-value">
    {#if implementations.length > 0}
        <!-- When there are multiple implementations - show drop-down with compatibles  -->
        <div class="select-row">
            <select
                value={selectedMnemonic ?? ""}
                onchange={handleImplementationChange}
            >
                <option value="">-- select --</option>
                {#each implementations as impl}
                    <option value={impl}>{impl}</option>
                {/each}
            </select>
            {#if selectedMnemonic}
                <span
                    class="info-icon"
                    role="button"
                    tabindex="-1"
                    onmouseenter={onDocsEnter}
                    onmouseleave={onDocsLeave}
                    onclick={onDocsClick}
                    onkeydown={onDocsClick}>i</span
                >
            {/if}
        </div>
        {#if selectedMnemonic}
            {#key selectedMnemonic}
                <Self
                    {yaml}
                    mnemonic={selectedMnemonic}
                    context={childContext}
                    onchange={nestedMnemonicChange}
                />
            {/key}
        {/if}
    {:else}
        <!-- When this is a concrete implementation, render the parameters -->
        {#each params as param (param.name)}
            <ParameterField
                parameterYaml={extractParameterYaml(
                    yaml.v ?? yaml.factory ?? null,
                    param,
                )}
                parameterSpec={param}
                context={{
                    ...childContext,
                    isFactory: yaml.factory?.[param.name] !== undefined,
                }}
                onFactoryChange={(checked) =>
                    handleFactoryChange(param.name, checked)}
                onchange={(value) => parameterChange(param.name, value)}
            />
        {/each}
    {/if}
</div>
{#if showDocs && docsMnemonic}
    <DocsPopover
        url="/docs/autogen.md?target={docsMnemonic}"
        title={docsMnemonic}
        pinned={docsPinned}
        onclose={closeDocs}
        onmouseenter={onDocsPopoverEnter}
        onmouseleave={onDocsPopoverLeave}
    />
{/if}

<style>
    .mnemonic-value {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .select-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 6px;
    }
    .select-row select {
        margin-bottom: 0;
    }
    .info-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--surface-3);
        color: var(--text-muted);
        font-size: 9px;
        font-weight: bold;
        cursor: pointer;
        user-select: none;
    }
    .info-icon:hover {
        background: var(--border-default);
        color: var(--text-primary);
    }
    select {
        flex: 1;
        min-width: 0;
        padding: 4px 8px;
        border: 1px solid var(--border-default);
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
        background: var(--surface-2);
        color: var(--text-primary);
        margin-bottom: 6px;
    }
    select:focus {
        outline: none;
        border-color: var(--primary);
    }
</style>
