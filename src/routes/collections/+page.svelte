<script lang="ts">
  import { Button } from '$lib/components/ui/button';
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold tracking-tight">Collections</h1>
    <Button href="/collections/new">New Collection</Button>
  </div>

  <div class="rounded-lg border">
    <div class="p-4">
      <p class="text-sm text-muted-foreground">
        No collections created yet. Collections help you organize your feeds into meaningful groups.
      </p>
    </div>
  </div>
</div>
