<script lang="ts">
  import { Button } from '$lib/components/ui/button';
</script>

<div class="space-y-4">
  <div class="flex flex-col items-center justify-center text-center">
    <h1 class="text-4xl font-bold tracking-tight">RSS AI</h1>
    <p class="mt-2 text-lg text-muted-foreground">
      Your intelligent RSS feed aggregator powered by AI
    </p>
  </div>

  <div class="flex justify-center space-x-4">
    <Button href="/feeds">Manage Feeds</Button>
    <Button variant="outline" href="/collections">Browse Collections</Button>
  </div>
</div>
