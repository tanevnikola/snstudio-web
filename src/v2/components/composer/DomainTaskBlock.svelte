<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import DomainFunctionMapBlock from "./DomainFunctionMapBlock.svelte";
    import DomainFunctionCollectionBlock from "./DomainFunctionCollectionBlock.svelte";

    let { yaml = {}, domainFunctionParams = [] } = $props();

    function getParamYaml(param) {
        if (param.name === "@delegating@") {
            return yaml?.v;
        }
        if (
            yaml?.v &&
            param.injectionStrategy === "COLLECTION" &&
            !Array.isArray(yaml.v[param.name])
        ) {
            yaml.v[param.name] = [];
        }
        return yaml?.v?.[param.name];
    }
</script>

{#each domainFunctionParams as param (param.name)}
    <div class="children" class:named={param.name !== "@delegating@"}>
        {#if param.name !== "@delegating@"}
            <span class="param-label">{param.name}</span>
        {/if}
        <div class="children-content">
            {#if param.injectionStrategy === "DIRECT"}
                <DomainFunctionBlock
                    yaml={getParamYaml(param)}
                    onremove={() => {
                        if (param.name === "@delegating@") {
                            yaml.v = null;
                        } else {
                            delete yaml.v[param.name];
                        }
                    }}
                />
            {:else if param.injectionStrategy === "MAP"}
                <DomainFunctionMapBlock yaml={getParamYaml(param)} />
            {:else if param.injectionStrategy === "COLLECTION"}
                <DomainFunctionCollectionBlock yaml={getParamYaml(param)} />
            {/if}
        </div>
    </div>
{/each}

<style>
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
