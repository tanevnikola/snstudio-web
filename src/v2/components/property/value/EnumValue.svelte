<script>
    import { getPrimitiveValue } from "../../../yamlUtils";

  let { yaml, mnemonic, spec, options = [], onchange = () => {} } = $props();

  function handleChange(e) {
    const v = /** @type {HTMLSelectElement} */ (e.target).value
    onchange(v === '' ? null : {t: mnemonic, v: v});
  }
</script>

<select value={getPrimitiveValue(yaml, spec)} onchange={handleChange}>
  <option value="">—</option>
  {#each options as opt}
    <option value={opt}>{opt}</option>
  {/each}
</select>

<style>
  select {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
    background: white;
  }
  select:focus {
    outline: none;
    border-color: #4a9eff;
  }
</style>
