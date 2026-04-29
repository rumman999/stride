<script lang="ts">
  import DOMPurify from 'isomorphic-dompurify';

  let {
    title,
    contentMd,
    class: className = '',
    children,
  }: {
    title?: string;
    contentMd?: string;
    class?: string;
    children?: import('svelte').Snippet;
  } = $props();

  const sanitizedContent = $derived(contentMd ? DOMPurify.sanitize(contentMd) : '');
</script>

<div class="flex h-full flex-col overflow-hidden {className}">
  {#if title}
    <div class="border-b px-4 py-3">
      <h2 class="text-sm font-semibold">{title}</h2>
    </div>
  {/if}
  <div class="flex-1 overflow-y-auto px-4 py-3">
    {#if contentMd}
      <div class="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html sanitizedContent}
      </div>
    {:else if children}
      {@render children()}
    {:else}
      <p class="text-sm text-muted-foreground">No description provided.</p>
    {/if}
  </div>
</div>
