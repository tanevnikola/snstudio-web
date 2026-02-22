<script>
  let { onclick = () => {}, initial, confirm, resetMs = 2000 } = $props();

  let confirming = $state(false);
  let timer;

  function handleClick() {
    if (confirming) {
      confirming = false;
      clearTimeout(timer);
      onclick();
    } else {
      confirming = true;
      timer = setTimeout(() => { confirming = false; }, resetMs);
    }
  }
</script>

<button class="confirm-btn" class:confirming onclick={handleClick}>
  {#if confirming}
    {@render confirm()}
  {:else}
    {@render initial()}
  {/if}
</button>

<style>
  .confirm-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
</style>
