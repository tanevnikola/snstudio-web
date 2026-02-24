<script>
  let { value = '', options = [], onchange = () => {} } = $props();

  // $effect(() => {
  //   console.log('[EnumValue]', 'value:', value);
  // });
</script>

<select value={value} onchange={(e) => onchange(/** @type {HTMLSelectElement} */ (e.target).value)}>
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
