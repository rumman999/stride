<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte';
  import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
  import Camera from 'phosphor-svelte/lib/Camera';
  import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
  import CaretRight from 'phosphor-svelte/lib/CaretRight';
  import Pause from 'phosphor-svelte/lib/Pause';
  import Play from 'phosphor-svelte/lib/Play';
  import SkipBack from 'phosphor-svelte/lib/SkipBack';
  import SkipForward from 'phosphor-svelte/lib/SkipForward';
  import Trash from 'phosphor-svelte/lib/Trash';
  import { createHighlighter } from 'shiki';
  import { ShikiMagicMove } from 'shiki-magic-move/svelte';

  import 'shiki-magic-move/dist/style.css';

  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { api } from '$convex/_generated/api';
  import type { Id } from '$convex/_generated/dataModel';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Slider } from '$lib/components/ui/slider/index.js';
  import { localizeHref } from '$lib/paraglide/runtime';

  const client = useConvexClient();

  // ---------------------------------------------------------------------------
  // Session selection
  // ---------------------------------------------------------------------------

  const sessionsQuery = useQuery(api.snapshots.getSessions, {});

  let selectedSessionId = $state<Id<'sessions'> | null>(
    (page.url.searchParams.get('sessionId') as Id<'sessions'>) ?? null,
  );

  function selectSession(id: Id<'sessions'>) {
    selectedSessionId = id;
    currentIndex = 0;
    isPlaying = false;
    goto(resolve(localizeHref(`/test/snapshot-view?sessionId=${id}`) as '/test/snapshot-view'), {
      replaceState: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Queries — conditional via "skip"
  // ---------------------------------------------------------------------------

  const snapshotsQuery = useQuery(api.snapshots.getSnapshots, () =>
    selectedSessionId ? { sessionId: selectedSessionId } : 'skip',
  );

  const sessionQuery = useQuery(api.snapshots.getSession, () =>
    selectedSessionId ? { sessionId: selectedSessionId } : 'skip',
  );

  const snapshots = $derived(snapshotsQuery.data ?? []);
  const session = $derived(sessionQuery.data ?? null);

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  let currentIndex = $state(0);
  let isPlaying = $state(false);
  // Each speed bundles the interval and the max animation duration together so
  // the animation always finishes before the next frame arrives.
  const SPEEDS = [
    { label: '1×', interval: 1500, duration: 600, stagger: 0.3 },
    { label: '2×', interval: 800, duration: 250, stagger: 0 },
    { label: '3×', interval: 450, duration: 120, stagger: 0 },
    { label: '4×', interval: 250, duration: 0, stagger: 0 },
  ];

  let speedIndex = $state(0); // default 1×
  const activeSpeed = $derived(SPEEDS[speedIndex]);
  const playbackSpeed = $derived(activeSpeed.interval);

  const currentSnapshot = $derived(snapshots[currentIndex] ?? null);
  const currentCode = $derived(currentSnapshot?.content ?? '');
  const language = $derived(session?.language ?? 'typescript');

  // Clamp when snapshot list shrinks
  $effect(() => {
    if (snapshots.length > 0 && currentIndex >= snapshots.length) currentIndex = snapshots.length - 1;
  });

  // Auto-play timer — loops back to 0 at the end
  $effect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      currentIndex = currentIndex < snapshots.length - 1 ? currentIndex + 1 : 0;
    }, playbackSpeed);
    return () => clearInterval(id);
  });

  function togglePlay() {
    isPlaying = !isPlaying;
  }
  function stepBack() {
    isPlaying = false;
    if (currentIndex > 0) currentIndex--;
  }
  function stepForward() {
    isPlaying = false;
    if (currentIndex < snapshots.length - 1) currentIndex++;
  }
  function jumpToStart() {
    isPlaying = false;
    currentIndex = 0;
  }
  function jumpToEnd() {
    isPlaying = false;
    currentIndex = Math.max(0, snapshots.length - 1);
  }

  // ---------------------------------------------------------------------------
  // Shiki
  // ---------------------------------------------------------------------------

  const highlighterPromise = createHighlighter({
    themes: ['github-dark'],
    langs: [
      'typescript',
      'javascript',
      'python',
      'rust',
      'go',
      'css',
      'html',
      'json',
      'markdown',
      'bash',
      'sql',
      'svelte',
      'tsx',
      'jsx',
    ],
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function formatTime(ms: number) {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function relativeLabel(snap: { _creationTime: number }, index: number) {
    if (index === 0) return 'Start';
    const first = snapshots[0]?._creationTime ?? snap._creationTime;
    const diffSec = Math.round((snap._creationTime - first) / 1000);
    if (diffSec < 60) return `+${diffSec}s`;
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `+${m}m${s > 0 ? `${s}s` : ''}`;
  }

  // ---------------------------------------------------------------------------
  // Delete session
  // ---------------------------------------------------------------------------

  let isDeleting = $state(false);

  async function deleteSession() {
    if (!selectedSessionId) return;
    if (!confirm('Delete this entire session and all its snapshots?')) return;
    isDeleting = true;
    try {
      await client.mutation(api.snapshots.deleteSession, { sessionId: selectedSessionId });
      selectedSessionId = null;
      goto(resolve(localizeHref('/test/snapshot-view') as '/test/snapshot-view'), {
        replaceState: true,
      });
    } finally {
      isDeleting = false;
    }
  }
</script>

<div class="min-h-screen bg-background text-foreground">
  <!-- Top bar -->
  <header class="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
    <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
      <Button href={resolve(localizeHref('/test/snapshot-take') as '/test/snapshot-take')} variant="ghost" size="sm">
        <ArrowLeft /> Recorder
      </Button>

      <Separator orientation="vertical" class="h-4" />

      <div class="flex items-center gap-2">
        <Camera size={16} class="text-muted-foreground" />
        <span class="text-sm font-medium">{session ? session.name : 'Snapshot Viewer'}</span>
        {#if session}
          <Badge variant="outline">{session.language}</Badge>
        {/if}
      </div>

      {#if selectedSessionId}
        <Button
          variant="ghost"
          size="icon-sm"
          onclick={deleteSession}
          disabled={isDeleting}
          class="ml-auto hover:text-destructive"
          title="Delete session"
        >
          <Trash size={14} />
        </Button>
      {/if}
    </div>
  </header>

  <div class="mx-auto max-w-6xl p-4">
    {#if !selectedSessionId}
      <!-- Session picker -->
      <div class="py-16 text-center">
        <Camera size={36} class="mx-auto mb-4 text-muted-foreground" />
        <h2 class="mb-1 text-lg font-semibold">Pick a Session</h2>
        <p class="mb-8 text-sm text-muted-foreground">Select a recording to view its code evolution.</p>

        {#if sessionsQuery.isLoading}
          <p class="text-sm text-muted-foreground">Loading…</p>
        {:else if !sessionsQuery.data?.length}
          <div class="space-y-3">
            <p class="text-sm text-muted-foreground">No sessions yet.</p>
            <Button href={resolve(localizeHref('/test/snapshot-take') as '/test/snapshot-take')}>
              <Camera size={14} /> Record a Session
            </Button>
          </div>
        {:else}
          <div class="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
            {#each sessionsQuery.data as s (s._id)}
              <button
                type="button"
                onclick={() => selectSession(s._id)}
                class="flex flex-col items-start rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
              >
                <span class="font-medium">{s.name}</span>
                <span class="mt-0.5 text-xs text-muted-foreground">
                  {s.language} · {s.snapshotCount} snapshots
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {:else if snapshotsQuery.isLoading}
      <div class="flex items-center justify-center py-24">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    {:else if snapshots.length === 0}
      <div class="py-16 text-center">
        <p class="text-sm text-muted-foreground">No snapshots yet — keep recording!</p>
        <a
          href={resolve(localizeHref('/test/snapshot-take') as '/test/snapshot-take')}
          class="mt-3 inline-block text-sm text-primary underline underline-offset-4"
        >
          Go record
        </a>
      </div>
    {:else}
      <!-- Main viewer -->
      <div class="flex gap-4">
        <!-- Left: Code + controls -->
        <div class="min-w-0 flex-1 space-y-3">
          <!-- Code block -->
          <Card.Root class="overflow-hidden">
            <div class="flex items-center gap-2 border-b border-border px-4 py-2">
              <span class="text-xs text-muted-foreground">{language}</span>
              <span class="ml-auto text-xs text-muted-foreground">
                {currentIndex + 1} / {snapshots.length}
              </span>
            </div>

            <div class="min-h-[420px] overflow-auto">
              {#await highlighterPromise}
                <div class="flex h-64 items-center justify-center">
                  <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              {:then highlighter}
                <ShikiMagicMove
                  {highlighter}
                  lang={language}
                  theme="github-dark"
                  code={currentCode}
                  options={{
                    duration: activeSpeed.duration,
                    stagger: activeSpeed.stagger,
                    lineNumbers: false,
                    enhanceMatching: false,
                  }}
                  class="text-sm leading-relaxed"
                />
              {/await}
            </div>
          </Card.Root>

          <!-- Playback controls -->
          <Card.Root>
            <Card.Content class="flex items-center gap-1 py-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={jumpToStart}
                disabled={currentIndex === 0}
                title="Jump to start"
              >
                <SkipBack size={15} />
              </Button>
              <Button variant="ghost" size="icon-sm" onclick={stepBack} disabled={currentIndex === 0} title="Previous">
                <CaretLeft size={15} />
              </Button>

              <Button
                onclick={togglePlay}
                size="icon-sm"
                class="mx-1 rounded-full"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {#if isPlaying}
                  <Pause size={13} weight="fill" />
                {:else}
                  <Play size={13} weight="fill" />
                {/if}
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onclick={stepForward}
                disabled={currentIndex >= snapshots.length - 1}
                title="Next"
              >
                <CaretRight size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onclick={jumpToEnd}
                disabled={currentIndex >= snapshots.length - 1}
                title="Jump to end"
              >
                <SkipForward size={15} />
              </Button>

              <Separator orientation="vertical" class="mx-2 h-4" />

              <!-- Speed -->
              <div class="flex items-center gap-0.5">
                {#each SPEEDS as sp, i (sp.label)}
                  <Button variant={speedIndex === i ? 'secondary' : 'ghost'} size="xs" onclick={() => (speedIndex = i)}>
                    {sp.label}
                  </Button>
                {/each}
              </div>

              {#if currentSnapshot}
                <span class="ml-auto text-xs text-muted-foreground tabular-nums">
                  {formatTime(currentSnapshot._creationTime)}
                </span>
              {/if}
            </Card.Content>
          </Card.Root>

          <!-- Slider -->
          <Card.Root>
            <Card.Content class="space-y-3 py-4">
              <Slider
                type="single"
                bind:value={currentIndex}
                min={0}
                max={Math.max(0, snapshots.length - 1)}
                step={1}
                onValueChange={() => (isPlaying = false)}
              />
              <!-- Tick labels -->
              <div class="relative h-4 text-[10px] text-muted-foreground">
                {#each snapshots as snap, i (snap._id)}
                  {#if i === 0 || i === snapshots.length - 1 || snapshots.length <= 10 || i % Math.ceil(snapshots.length / 8) === 0}
                    <span
                      class="absolute -translate-x-1/2 {i === currentIndex ? 'text-foreground' : ''}"
                      style="left: {(i / Math.max(1, snapshots.length - 1)) * 100}%"
                    >
                      {relativeLabel(snap, i)}
                    </span>
                  {/if}
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        </div>

        <!-- Right: Timeline sidebar -->
        <aside class="hidden w-48 shrink-0 xl:block">
          <div class="sticky top-16 overflow-y-auto" style="max-height: calc(100vh - 5rem)">
            <p class="mb-2 px-1 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Timeline</p>
            <div class="space-y-0.5">
              {#each snapshots as snap, i (snap._id)}
                <button
                  type="button"
                  onclick={() => {
                    isPlaying = false;
                    currentIndex = i;
                  }}
                  class="group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors
                    {i === currentIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  <div class="mt-0.5 flex flex-col items-center gap-0.5">
                    <span
                      class="h-1.5 w-1.5 rounded-full
                      {i === currentIndex ? 'bg-primary' : 'bg-border group-hover:bg-muted-foreground'}"
                    ></span>
                    {#if i < snapshots.length - 1}
                      <span class="h-5 w-px bg-border"></span>
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium tabular-nums">{relativeLabel(snap, i)}</p>
                    <p class="truncate opacity-70">{formatTime(snap._creationTime)}</p>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>
