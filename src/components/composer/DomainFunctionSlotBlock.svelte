<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    import DomainFunctionDropZone from "./DomainFunctionDropZone.svelte";
    import { setSelectionYaml, flush } from "./composerState.svelte.js";
    import { fetchSpec, isInjectionCollection, getSpec } from "../../mnemoUtils.js";

    let {
        yaml = null,
        ancestorParams = [],
        onset = () => {},
        onremove = () => {},
    } = $props();

    let hasValue = $derived(
        yaml != null &&
            typeof yaml === "object" &&
            ("task" in yaml || "tasks" in yaml),
    );

    function handleDrop({ item, mnemonic }) {
        if (item) {
            onset(item);
            setSelectionYaml(item);
        } else if (mnemonic) {
            const taskV = isInjectionCollection(mnemonic) ? [] : {};
            const newItem = { task: { t: mnemonic, v: taskV } };
            onset(newItem);
            setSelectionYaml(newItem);
            if (!getSpec(mnemonic)) fetchSpec(mnemonic);
        }
        flush();
    }
</script>

{#if hasValue}
    <DomainFunctionBlock {yaml} {ancestorParams} {onremove} />
{:else}
    <DomainFunctionDropZone style="margin-left: 1.25rem" ondrop={handleDrop} />
{/if}
