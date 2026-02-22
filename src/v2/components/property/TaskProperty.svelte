<script>
  import { getContext } from 'svelte';

  const selection = getContext('selection');
  let yaml = $derived(selection.yaml);
</script>

<pre>{JSON.stringify(yaml, null, 2)}</pre>
