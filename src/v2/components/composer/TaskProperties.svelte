<script>
    import { getSelectionYaml, flush } from "./composerState.svelte.js";
    import ObjectProperties from "../property/ObjectProperties.svelte";
    import { extractTaskMnemonic, extractTaskYaml } from "../../yamlUtils.js";

    let functionYaml = $derived(getSelectionYaml());
    let taskYaml = $derived(extractTaskYaml(functionYaml));
    let mnemonic = $derived(extractTaskMnemonic(taskYaml));
    let collapsed = $state(false);
    function onchange(updatedTaskYaml) {
        const sel = getSelectionYaml();
        const task = sel.task ?? sel;
        if (JSON.stringify(task) === JSON.stringify(updatedTaskYaml)) return;
        // Mutate in-place so flush() sees the changes on the parsed tree
        Object.keys(task).forEach((k) => {
            if (!(k in updatedTaskYaml)) delete task[k];
        });
        Object.assign(task, updatedTaskYaml);
        flush();
    }
</script>

{#if mnemonic}
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
        <span class="mnemonic">{mnemonic}</span>
    </div>
    {#if !collapsed}
        {#key functionYaml}
            <ObjectProperties yaml={taskYaml} {onchange} />
        {/key}
    {/if}
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
