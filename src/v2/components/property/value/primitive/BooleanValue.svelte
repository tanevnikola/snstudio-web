<script>
  let { yaml = null, key = '', parameterSpec = null } = $props();
  let value = $derived(yaml?.[key] ?? false);
</script>

<input type="checkbox" checked={value} />

<style>
  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
</style>
