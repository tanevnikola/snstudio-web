<script>
  let { yaml = null, key = '', parameterSpec = null } = $props();
  let value = $derived(yaml?.v?.[key] ?? '');
</script>

<input type="text" value={value} />

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
