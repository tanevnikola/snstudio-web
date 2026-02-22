<script>
  let { yaml, parameterSpec } = $props();
  let parameterName = $derived(parameterSpec?.name ?? null);
  let value = $derived(yaml?.[parameterName] ?? false);
</script>

<input type="checkbox" checked={value} onchange={(e) => yaml[parameterName] = /** @type {HTMLInputElement} */ (e.target).checked} />

<style>
  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
</style>
