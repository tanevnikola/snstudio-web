<script>
  let { paramName, acceptedMnemonic, ondrop } = $props();
  let hovering = $state(false);

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    hovering = true;
  }

  function handleDragLeave() {
    hovering = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    hovering = false;
    const mnemonic = e.dataTransfer.getData('text/plain');
    if (mnemonic && ondrop) {
      ondrop(mnemonic, paramName);
    }
  }
</script>

<div
  class="dropzone"
  class:hovering
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label="Drop zone for {paramName}"
>
  <span class="hint">{paramName}: drop {acceptedMnemonic} here</span>
</div>

<style>
  .dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.35rem;
    padding: 0.5rem 1rem;
    border: 2px dashed #ccc;
    border-radius: 6px;
    min-height: 2.25rem;
    transition: border-color 0.15s, background 0.15s;
  }

  .dropzone.hovering {
    border-color: #666;
    background: #eef;
  }

  .hint {
    font-size: 0.75rem;
    color: #999;
  }
</style>
