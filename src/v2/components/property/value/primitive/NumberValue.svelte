<script>
  let { value = '', onchange = () => {} } = $props();
</script>

<input type="text" value={value} oninput={(e) => onchange(/** @type {HTMLInputElement} */ (e.target).value)} />

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
