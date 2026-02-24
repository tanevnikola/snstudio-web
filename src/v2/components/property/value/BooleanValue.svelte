<script>
  let { yaml, mnemonic, onchange = () => {} } = $props();

  function handleChange(e) {
    const v = /** @type {HTMLInputElement} */ (e.target).checked;
    onchange({t: mnemonic, v: v});
  }
</script>

<input type="checkbox" checked={yaml.v} onchange={handleChange} />

<style>
  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
</style>
