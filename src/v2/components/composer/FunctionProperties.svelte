<script>
    import { getSelectionYaml, flush } from "./composerState.svelte.js";
    import ObjectProperties from "../property/ObjectProperties.svelte";
    import { extractFunctionPropertiesYaml } from "../../yamlUtils.js";

    let functionYaml = $derived(getSelectionYaml());
    function onchange(updatedProperties) {
        const sel = getSelectionYaml();
        if (!sel) return;
        Object.assign(sel, updatedProperties.v);
        flush();
    }

    let collapsed = $state(true);
</script>

<div
    class="header"
    role="button"
    tabindex="0"
    onclick={() => (collapsed = !collapsed)}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            collapsed = !collapsed;
        }
    }}
>
    <span class="chevron">{collapsed ? "▶" : "▼"}</span>
    <span class="mnemonic">Function</span>
</div>
{#if !collapsed}
    {#key functionYaml}
        <ObjectProperties
            yaml={extractFunctionPropertiesYaml(functionYaml)}
            {onchange}
        />
    {/key}
{/if}

<style>
    .header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--border-default);
        cursor: pointer;
        user-select: none;
    }
    .header:hover {
        background: var(--surface-3);
    }
    .chevron {
        font-size: 8px;
        color: var(--text-muted);
        width: 10px;
        flex-shrink: 0;
    }
    .mnemonic {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }
</style>
