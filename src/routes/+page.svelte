<script lang="ts">
  import LanguagesIcon from '@lucide/svelte/icons/languages';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { useConvexClient, useQuery } from 'convex-svelte';
  import { toggleMode } from 'mode-watcher';

  import { api } from '$convex/_generated/api.js';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { m } from '$lib/paraglide/messages.js';
  import { getLocale, setLocale } from '$lib/paraglide/runtime.js';

  const client = useConvexClient();
  const query = useQuery(api.tasks.get, {});

  let newTaskText = $state('');
  let adding = $state(false);
  let interacting = $state<string | null>(null);

  let currentLocale = $state(getLocale());

  async function handleAdd(e: Event) {
    e.preventDefault();
    if (!newTaskText.trim() || adding) return;
    try {
      adding = true;
      await client.mutation(api.tasks.add, { text: newTaskText });
      newTaskText = '';
    } finally {
      adding = false;
    }
  }

  async function toggleTask(id: any) {
    if (interacting) return;
    try {
      interacting = id;
      await client.mutation(api.tasks.toggle, { id });
    } finally {
      interacting = null;
    }
  }

  async function removeTask(id: any) {
    if (interacting) return;
    try {
      interacting = id;
      await client.mutation(api.tasks.remove, { id });
    } finally {
      interacting = null;
    }
  }

  function toggleLanguage() {
    const nextLocale = currentLocale === 'en' ? 'bn' : 'en';
    setLocale(nextLocale, { reload: false });
    currentLocale = nextLocale;
  }
</script>

{#key currentLocale}
  <div class="min-h-screen bg-background p-8 text-foreground">
    <div class="relative mx-auto max-w-md space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight">{m.todo_title()}</h1>
        <div class="flex gap-2">
          <Button onclick={toggleLanguage} variant="outline" size="icon">
            <LanguagesIcon class="h-[1.2rem] w-[1.2rem]" />
            <span class="sr-only">Toggle language</span>
          </Button>
          <Button onclick={toggleMode} variant="outline" size="icon">
            <SunIcon class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90" />
            <MoonIcon
              class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
            />
            <span class="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      <Card.Root>
        <Card.Header>
          <Card.Title>{m.todo_title()}</Card.Title>
          <Card.Description>{m.tasks_description()}</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4">
          <form onsubmit={handleAdd} class="mb-6 flex gap-2">
            <Input placeholder={m.add_task_placeholder()} bind:value={newTaskText} class="flex-1" />
            <Button type="submit" disabled={adding}>{m.add_button()}</Button>
          </form>

          <div class="space-y-3">
            {#if query.isLoading}
              <div class="p-4 text-center text-muted-foreground">Loading...</div>
            {:else if query.error}
              <div class="p-4 text-center text-destructive">Failed to load: {query.error.toString()}</div>
            {:else if query.data.length === 0}
              <div class="p-4 text-center text-muted-foreground">No tasks found.</div>
            {:else}
              {#each query.data as task (task._id)}
                <div class="group flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Checkbox
                      id={task._id}
                      checked={task.isCompleted}
                      onCheckedChange={() => toggleTask(task._id)}
                      disabled={interacting === task._id}
                    />
                    <Label
                      for={task._id}
                      class="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {task.isCompleted
                        ? 'text-muted-foreground line-through'
                        : ''}"
                    >
                      {task.text}
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onclick={() => removeTask(task._id)}
                    disabled={interacting === task._id}
                  >
                    {m.delete_button()}
                  </Button>
                </div>
              {/each}
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
{/key}
