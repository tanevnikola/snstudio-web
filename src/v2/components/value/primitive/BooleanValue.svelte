<script>
  let { value = false, onchange = () => {} } = $props();
</script>

<input type="checkbox" checked={value} onchange={(e) => onchange(/** @type {HTMLInputElement} */ (e.target).checked)} />

<style>
  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
</style>
