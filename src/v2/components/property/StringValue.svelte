<script>
  import { getPrimitiveValue } from "../../yamlUtils";

  let { yaml, mnemonic, spec, onchange = () => {} } = $props();

  let textareaEl;
  let value = $derived(getPrimitiveValue(yaml, spec) ?? '');
  let isMultiline = $derived(typeof value === 'string' && value.includes('\n'));

  function handleInput(e) {
    autoResize(e.target);
  }

  function handleBlur(e) {
    const v = /** @type {HTMLTextAreaElement} */ (e.target).value;
    onchange(v === '' ? null : {t: mnemonic, v: v});
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  $effect(() => {
    if (textareaEl && isMultiline) {
      autoResize(textareaEl);
    }
  });
</script>

{#if isMultiline}
  <textarea
    bind:this={textareaEl}
    value={value}
    oninput={handleInput}
    onblur={handleBlur}
  ></textarea>
{:else}
  <input type="text" value={value} onblur={handleBlur} />
{/if}

<style>
  input, textarea {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
  }
  textarea {
    resize: vertical;
    overflow-y: auto;
    max-height: 200px;
    min-height: 28px;
  }
  input:focus, textarea:focus {
    outline: none;
    border-color: #4a9eff;
  }
</style>
