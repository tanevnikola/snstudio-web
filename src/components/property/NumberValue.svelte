<script>
    import { getPrimitiveValue } from "../../yamlUtils";

    let { yaml, mnemonic, spec, onchange = () => {} } = $props();

    function handleBlur(e) {
        const v = /** @type {HTMLInputElement} */ (e.target).value;
        const num = Number(v);
        onchange(v === "" ? null : num);
    }
</script>

<input type="text" value={getPrimitiveValue(yaml, spec)} onblur={handleBlur} />

<style>
    input {
        width: 100%;
        padding: 4px 8px;
        border: 1px solid var(--border-default);
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
        background: var(--surface-2);
        color: var(--text-primary);
    }
    input:focus {
        outline: none;
        border-color: var(--primary);
    }
</style>
