<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import ArrowRight from 'phosphor-svelte/lib/ArrowRight';
  import Camera from 'phosphor-svelte/lib/Camera';
  import Clock from 'phosphor-svelte/lib/Clock';
  import Hash from 'phosphor-svelte/lib/Hash';
  import Play from 'phosphor-svelte/lib/Play';
  import Square from 'phosphor-svelte/lib/Square';

  import { resolve } from '$app/paths';
  import { api } from '$convex/_generated/api';
  import type { Id } from '$convex/_generated/dataModel';

  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { localizeHref } from '$lib/paraglide/runtime';

  const client = useConvexClient();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let sessionName = $state('My Session');
  let language = $state('typescript');
  let intervalSecs = $state(5);
  let code = $state(`// Start typing your code here…\nconst greeting = 'hello world';\nconsole.log(greeting);\n`);

  let activeSessionId = $state<Id<'sessions'> | null>(null);
  let isRecording = $state(false);
  let snapshotCount = $state(0);
  let lastSnapshotAt = $state<Date | null>(null);
  let lastSavedContent = $state<string | null>(null);
  let timerId = $state<ReturnType<typeof setInterval> | null>(null);
  let statusMsg = $state('');

  const sessionsQuery = useQuery(api.snapshots.getSessions, {});

  const LANGUAGES = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'rust', label: 'Rust' },
    { value: 'go', label: 'Go' },
    { value: 'css', label: 'CSS' },
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'bash', label: 'Bash' },
    { value: 'sql', label: 'SQL' },
    { value: 'svelte', label: 'Svelte' },
  ];

  const INTERVALS = [
    { value: 2, label: 'Every 2s' },
    { value: 5, label: 'Every 5s' },
    { value: 10, label: 'Every 10s' },
    { value: 30, label: 'Every 30s' },
    { value: 60, label: 'Every 60s' },
  ];

  // ---------------------------------------------------------------------------
  // Recording
  // ---------------------------------------------------------------------------

  async function takeSnapshot() {
    if (!activeSessionId) return;
    if (code === lastSavedContent) {
      statusMsg = 'No changes — snapshot skipped';
      return;
    }
    try {
      await client.mutation(api.snapshots.saveSnapshot, {
        sessionId: activeSessionId,
        content: code,
      });
      snapshotCount++;
      lastSnapshotAt = new Date();
      lastSavedContent = code;
      statusMsg = `Snapshot #${snapshotCount} saved at ${lastSnapshotAt.toLocaleTimeString()}`;
    } catch (e) {
      statusMsg = `Error: ${e}`;
    }
  }

  async function startRecording() {
    if (isRecording) return;
    const id = await client.mutation(api.snapshots.createSession, { name: sessionName, language });
    activeSessionId = id as Id<'sessions'>;
    snapshotCount = 0;
    lastSnapshotAt = null;
    lastSavedContent = null;
    isRecording = true;
    statusMsg = 'Recording started…';
    await takeSnapshot();
    timerId = setInterval(takeSnapshot, intervalSecs * 1000);
  }

  function stopRecording() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    isRecording = false;
    statusMsg = `Recording stopped — ${snapshotCount} snapshot${snapshotCount !== 1 ? 's' : ''} saved.`;
  }

  $effect(() => () => {
    if (timerId !== null) clearInterval(timerId);
  });
</script>

<div class="min-h-screen bg-background p-6 text-foreground">
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Camera size={20} class="text-muted-foreground" />
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Snapshot Recorder</h1>
        <p class="text-sm text-muted-foreground">Capture code evolution over time</p>
      </div>

      {#if activeSessionId && !isRecording}
        <Button
          href={resolve(localizeHref(`/test/snapshot-view?sessionId=${activeSessionId}`) as '/test/snapshot-view')}
          variant="outline"
          size="sm"
          class="ml-auto"
        >
          View Snapshots <ArrowRight />
        </Button>
      {/if}
    </div>

    <Separator />

    <!-- Config -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="space-y-1.5">
        <Label for="session-name">Session Name</Label>
        <Input id="session-name" bind:value={sessionName} disabled={isRecording} placeholder="My Session" />
      </div>

      <div class="space-y-1.5">
        <Label for="language">Language</Label>
        <NativeSelect id="language" bind:value={language} disabled={isRecording} class="w-full">
          {#each LANGUAGES as lang (lang.value)}
            <NativeSelectOption value={lang.value}>{lang.label}</NativeSelectOption>
          {/each}
        </NativeSelect>
      </div>

      <div class="space-y-1.5">
        <Label for="interval">Snapshot Interval</Label>
        <NativeSelect id="interval" bind:value={intervalSecs} disabled={isRecording} class="w-full">
          {#each INTERVALS as iv (iv.value)}
            <NativeSelectOption value={iv.value}>{iv.label}</NativeSelectOption>
          {/each}
        </NativeSelect>
      </div>
    </div>

    <!-- Controls bar -->
    <div class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
      {#if !isRecording}
        <Button onclick={startRecording} size="sm">
          <Play weight="fill" /> Start Recording
        </Button>
      {:else}
        <Button onclick={stopRecording} variant="destructive" size="sm">
          <Square weight="fill" /> Stop
        </Button>

        <div class="flex items-center gap-2 text-sm text-destructive">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
          </span>
          REC
        </div>
      {/if}

      <div class="ml-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {#if snapshotCount > 0}
          <span class="flex items-center gap-1">
            <Hash size={12} />
            {snapshotCount} snapshot{snapshotCount !== 1 ? 's' : ''}
          </span>
        {/if}
        {#if lastSnapshotAt}
          <span class="flex items-center gap-1">
            <Clock size={12} />
            {lastSnapshotAt.toLocaleTimeString()}
          </span>
        {/if}
        {#if statusMsg}
          <span class="italic">{statusMsg}</span>
        {/if}
      </div>
    </div>

    <!-- Code editor -->
    <Card.Root class="overflow-hidden">
      <div class="flex items-center gap-2 border-b border-border px-4 py-2">
        <span class="text-xs text-muted-foreground">
          {LANGUAGES.find((l) => l.value === language)?.label ?? language}
        </span>
        {#if isRecording}
          <span class="ml-auto text-xs text-muted-foreground">
            Next snapshot in {intervalSecs}s
          </span>
        {/if}
      </div>

      <Textarea
        bind:value={code}
        spellcheck={false}
        autocomplete="off"
        autocapitalize="off"
        class="h-[60vh] min-h-[320px] w-full resize-none rounded-none border-0 bg-card p-4 font-mono text-sm leading-relaxed focus-visible:ring-0"
        placeholder="Type or paste code here…"
      />
    </Card.Root>

    <!-- Recent sessions -->
    {#if sessionsQuery.data && sessionsQuery.data.length > 0}
      <div class="space-y-3">
        <p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">Recent Sessions</p>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {#each sessionsQuery.data.slice(0, 6) as session (session._id)}
            <a
              href={resolve(localizeHref(`/test/snapshot-view?sessionId=${session._id}`) as '/test/snapshot-view')}
              class="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
            >
              <div>
                <p class="text-sm font-medium">{session.name}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">
                  {session.language} · {session.snapshotCount} snapshots
                </p>
              </div>
              <ArrowRight size={15} class="text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
