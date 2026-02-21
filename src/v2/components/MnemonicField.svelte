<script>
  import MnemonicValue from './value/MnemonicValue.svelte';

  let { parameterSpec } = $props();
</script>

<MnemonicValue mnemonic={parameterSpec.mnemonic} />
