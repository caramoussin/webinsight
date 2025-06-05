<script lang="ts">
  type Props = {
    title: string;
    source: string;
    time: string;
  };

  let { title, source, time }: Props = $props();
</script>

<div class="hover:variant-soft-primary list-item !rounded-none p-3">
  <div class="flex w-full items-center justify-between">
    <span class="text-primary-700-200-token font-medium">{title}</span>
    <div class="text-surface-700-200-token flex items-center gap-2 text-sm">
      <span class="badge variant-soft-secondary">{source}</span>
      <span>{time}</span>
    </div>
  </div>
</div>
