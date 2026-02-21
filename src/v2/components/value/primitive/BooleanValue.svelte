<script>
  let { label = '', value = false, onchange = () => {} } = $props();

  function toggle() {
    onchange(!value);
  }
</script>

<label class="bool-field" onclick={toggle}>
  <input type="checkbox" checked={value} />
  <span>{label}</span>
</label>

<style>
  .bool-field {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
  }
  input[type="checkbox"] {
    margin: 0;
    cursor: pointer;
  }
</style>
