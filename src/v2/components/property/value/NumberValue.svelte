<script>
  let { yaml, mnemonic, onchange = () => {} } = $props();

  function handleInput(e) {
    const v = /** @type {HTMLInputElement} */ (e.target).value;
    const num = Number(v);
    onchange(v === '' ? null : {t: mnemonic, v: isNaN(num) ? v : num});
  }
</script>

<input type="text" value={yaml.v} oninput={handleInput} />

<style>
  input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    box-sizing: border-box;
  }
  input:focus {
    outline: none;
    border-color: #4a9eff;
  }
</style>
