<script>
    import DomainFunctionBlock from "./DomainFunctionBlock.svelte";
    let { yaml = {}, ancestorParams = [] } = $props();
</script>

<DomainFunctionBlock {yaml} {ancestorParams} />
