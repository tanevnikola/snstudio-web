<script>
  import DomainTaskBlock from './DomainTaskBlock.svelte';

  let { title = '', detail = '', ondelete = () => {} } = $props();
</script>

<DomainTaskBlock {title} {detail} {ondelete} />
