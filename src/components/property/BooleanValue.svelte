<script>
    import { getPrimitiveValue } from "../../yamlUtils";

    let { yaml, mnemonic, spec, onchange = () => {} } = $props();

    function handleChange(e) {
        const v = /** @type {HTMLInputElement} */ (e.target).checked;
        onchange(v);
    }
</script>

<input
    type="checkbox"
    checked={getPrimitiveValue(yaml, spec)}
    onchange={handleChange}
/>

<style>
    input[type="checkbox"] {
        margin: 4px 0;
        cursor: pointer;
        flex: 0 0 auto !important;
    }
</style>
