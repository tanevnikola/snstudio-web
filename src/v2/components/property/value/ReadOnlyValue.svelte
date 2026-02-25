<script>
  import { getPrimitiveValue } from "../../../yamlUtils";

  let { yaml, spec } = $props();

  let value = $derived(getPrimitiveValue(yaml, spec) ?? '');
</script>

<input type="text" value={value} readonly />

<style>
  input {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
    background: #f0f0f0;
    color: #666;
    cursor: default;
  }
</style>
