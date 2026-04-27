<script lang="ts">
  // Robust Individual Icon Imports to fix [ERR_MODULE_NOT_FOUND]
  import CheckCircle2 from '@lucide/svelte/icons/check-circle';
  import FileCode from '@lucide/svelte/icons/file-code';
  import IdentificationCard from '@lucide/svelte/icons/id-card';
  import Info from '@lucide/svelte/icons/info';
  import Loader2 from '@lucide/svelte/icons/loader-2';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import Plus from '@lucide/svelte/icons/plus';
  import SkipBack from '@lucide/svelte/icons/skip-back';
  import SkipForward from '@lucide/svelte/icons/skip-forward';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Users from '@lucide/svelte/icons/users';
  import XCircle from '@lucide/svelte/icons/x-circle';

  import { page } from '$app/state';

  import { Badge } from '$lib/components/ui/badge/index.js';
  // UI Components
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label';
  import * as Resizable from '$lib/components/ui/resizable/index.js';
  import { Slider } from '$lib/components/ui/slider/index.js';
  import * as Table from '$lib/components/ui/table';

  // --- Snapshot Data ---
  const snapshots = [
  {
    id: '1',
    timestamp: '10:02 AM',
    content: `#include <stdio.h>

int main() {

    return 0;
}`
  },
  {
    id: '2',
    timestamp: '10:05 AM',
    content: `#include <stdio.h>

int main() {
    int a = 0;

    return 0;
}`
  },
  {
    id: '3',
    timestamp: '10:08 AM',
    content: `#include <stdio.h>

int main() {
    int a = 0, b = 0;

    return 0;
}`
  },
  {
    id: '4',
    timestamp: '10:12 AM',
    content: `#include <stdio.h>

int main() {
    int a, b;

    scanf("%d %d", &a, &b);

    return 0;
}`
  },
  {
    id: '5',
    timestamp: '10:15 AM',
    content: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    int sum = a + b;

    return 0;
}`
  },
  {
    id: '6',
    timestamp: '10:20 AM',
    content: `#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    int sum = a + b;

    printf("%d", sum);

    return 0;
}`
  },
  {
    id: '7',
    timestamp: '10:25 AM',
    content: `#include <stdio.h>

int add(int x, int y) {
    return x + y;
}

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    int result = add(a, b);

    printf("%d", result);

    return 0;
}`
  },
  {
    id: '8',
    timestamp: '10:32 AM',
    content: `#include <stdio.h>

int add(int x, int y) {
    return x + y;
}

int main() {
    int a, b;

    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);

    int result = add(a, b);

    printf("Sum = %d\\n", result);

    return 0;
}`
  },
  {
    id: '9',
    timestamp: '10:40 AM',
    content: `#include <stdio.h>

int add(int x, int y) {
    return x + y;
}

int main() {
    int a, b;

    if (scanf("%d %d", &a, &b) != 2) {
        printf("Invalid input\\n");
        return 1;
    }

    int result = add(a, b);

    printf("Sum = %d\\n", result);

    return 0;
}`
  },
  {
    id: '10',
    timestamp: '10:45 AM',
    content: `#include <stdio.h>

int add(int x, int y) {
    return x + y;
}

int main() {
    int a, b;

    if (scanf("%d %d", &a, &b) != 2) {
        printf("Invalid input\\n");
        return 1;
    }

    int result = add(a, b);

    if (result > 100) {
        printf("Large sum: %d\\n", result);
    } else {
        printf("Sum = %d\\n", result);
    }

    return 0;
}`
  }
];
  const studentFiles = ['+page.svelte', 'utils.ts', 'Button.svelte'];

  // --- State: Snapshot Navigation ---
  let currentIndex = $state(0);
  let isPlaying = $state(false);
  let speedIndex = $state(0);
  const SPEEDS = [
    { label: '1×', interval: 1000 },
    { label: '2×', interval: 500 },
    { label: '4×', interval: 200 },
  ];
  const currentSnapshot = $derived(snapshots[currentIndex] || snapshots[0]);

  // --- State: Judge0 Integration ---
  let { data }: { data: any } = $props();
  let languages = $derived(data?.languages || [{ id: 50, name: 'C (GCC 9.2.0)' }]);
  let selectedLanguageId = $state(50);

  interface TestCase {
    id: string;
    input: string;
    expected: string;
    result: any | null;
    status: 'idle' | 'running' | 'completed' | 'error';
  }

  let testCases = $state<TestCase[]>([
    { id: '1', input: '10 20', expected: '30', result: null, status: 'idle' },
    { id: '2', input: '5 7', expected: '12', result: null, status: 'idle' },
  ]);

  let newInput = $state('');
  let newExpected = $state('');
  let running = $state(false);
  let cpuTimeLimit = $state(1.0);
  let memoryLimit = $state(64000);

  // --- Functions ---
  function selectSnapshot(index: number) {
    isPlaying = false;
    currentIndex = index;
  }

  function addTestCase() {
    if (!newInput.trim()) return;
    testCases = [
      ...testCases,
      {
        id: Math.random().toString(36).substr(2, 6),
        input: newInput,
        expected: newExpected,
        result: null,
        status: 'idle',
      },
    ];
    newInput = '';
    newExpected = '';
  }

  function removeTestCase(id: string) {
    testCases = testCases.filter((t) => t.id !== id);
  }

  async function runAllTests() {
    if (running) return;
    running = true;
    testCases = testCases.map((t) => ({ ...t, status: 'running', result: null }));

    const payload = {
      submissions: testCases.map((t) => ({
        source_code: currentSnapshot.content,
        language_id: selectedLanguageId,
        stdin: t.input,
        expected_output: t.expected,
        cpu_time_limit: cpuTimeLimit,
        memory_limit: memoryLimit,
      })),
    };

    try {
      const res = await fetch('/api/judge0/submissions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const submissions = await res.json();
      await pollBatch(submissions.map((s: any) => s.token));
    } catch (e) {
      testCases = testCases.map((t) => ({ ...t, status: 'error' }));
    } finally {
      running = false;
    }
  }

  async function pollBatch(tokens: string[]) {
    let completed = false;
    while (!completed) {
      const res = await fetch(`/api/judge0/submissions/batch?tokens=${tokens.join(',')}`);
      const { submissions } = await res.json();
      testCases = testCases.map((t, i) => {
        const result = submissions[i];
        return result && result.status.id > 2 ? { ...t, result, status: 'completed' } : t;
      });
      completed = testCases.every((t) => t.status === 'completed');
      if (!completed) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  let passCount = $derived(testCases.filter((t) => t.result?.status.id === 3).length);

  $effect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      currentIndex = currentIndex < snapshots.length - 1 ? currentIndex + 1 : 0;
    }, SPEEDS[speedIndex].interval);
    return () => clearInterval(interval);
  });
</script>

<div class="h-screen w-full overflow-hidden bg-background font-sans">
  <Resizable.PaneGroup direction="horizontal" class="h-full">
    <Resizable.Pane defaultSize={75} minSize={40}>
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane defaultSize={65} minSize={30} class="bg-zinc-950 p-4">
          <div
            class="relative h-full overflow-hidden rounded-xl border border-emerald-500/30 bg-zinc-950 p-6 shadow-2xl"
          >
            <div class="relative mb-5 flex items-center justify-between border-b border-emerald-500/10 pb-4">
              <div class="flex items-center gap-3 text-emerald-400">
                <FileCode size={20} />
                <span class="text-base font-bold tracking-widest text-emerald-50 uppercase"
                  >src/routes/+page.svelte</span
                >
              </div>
              <div class="flex items-center gap-4">
                <select
                  bind:value={selectedLanguageId}
                  class="h-7 rounded border border-emerald-900/50 bg-zinc-900 px-2 text-[10px] text-emerald-400 outline-none"
                >
                  {#each languages as lang}<option value={lang.id}>{lang.name}</option>{/each}
                </select>
                <span
                  class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-400"
                >
                  {currentIndex + 1} / {snapshots.length}
                </span>
              </div>
            </div>
            <pre
              class="scrollbar-hide relative h-[calc(100%-4rem)] overflow-auto font-mono text-[15px] leading-relaxed text-emerald-50/90"><code
                >{currentSnapshot.content}</code
              ></pre>
          </div>
        </Resizable.Pane>

        <Resizable.Handle />

        <Resizable.Pane defaultSize={12} minSize={10} class="flex flex-col justify-center border-t bg-card px-12 py-3">
          <Slider
            value={[currentIndex]}
            max={snapshots.length - 1}
            step={1}
            onValueChange={(v) => selectSnapshot(v[0])}
            class="h-4"
          />
          <div class="mt-4 flex items-center justify-between">
            <div class="flex rounded-lg border bg-muted p-1">
              {#each SPEEDS as speed, i}
                <button
                  onclick={() => (speedIndex = i)}
                  class="rounded-md px-5 py-1 text-xs font-bold transition-all {speedIndex === i
                    ? 'bg-background text-emerald-600 shadow-sm'
                    : 'text-muted-foreground'}">{speed.label}</button
                >
              {/each}
            </div>
            <div class="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                class="h-9 w-9 rounded-full border-2"
                onclick={() => selectSnapshot(0)}><SkipBack size={18} /></Button
              >
              <Button
                variant="default"
                size="icon"
                class="h-11 w-11 rounded-full bg-emerald-600"
                onclick={() => (isPlaying = !isPlaying)}
              >
                {#if isPlaying}<Pause size={24} />{:else}<Play size={24} class="ml-1" />{/if}
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="h-9 w-9 rounded-full border-2"
                onclick={() => selectSnapshot(snapshots.length - 1)}><SkipForward size={18} /></Button
              >
            </div>
            <Button
              onclick={runAllTests}
              disabled={running}
              class="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              {#if running}<Loader2 class="mr-2 h-4 w-4 animate-spin" />{:else}<Play
                  class="mr-2 h-4 w-4 fill-current"
                />{/if}
              TEST SNAPSHOT
            </Button>
          </div>
        </Resizable.Pane>

        <Resizable.Handle />

        <Resizable.Pane defaultSize={23} minSize={15} class="border-t border-emerald-950 bg-zinc-950">
          <div class="flex h-full divide-x divide-emerald-900/30">
            <div class="flex flex-[0_0_28%] items-center gap-5 bg-white/5 p-5">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              >
                <Users size={24} weight="bold" />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Student</span>
                <span class="text-sm font-black text-white uppercase">Alex Rivera</span>
                <Badge
                  variant="outline"
                  class="mt-2 w-fit border-emerald-500/30 bg-emerald-500/10 text-[9px] text-emerald-400">ID: 7042</Badge
                >
              </div>
            </div>

            <div class="flex flex-grow items-center justify-center p-6">
              <div class="flex items-center gap-6">
                <Button
                  variant="outline"
                  class="h-[60px] border-zinc-800 bg-zinc-900/50 px-9 text-base font-bold tracking-wider text-zinc-300 uppercase"
                >
                  PREVIOUS STUDENT
                </Button>

                <Button variant="default" class="h-[60px] bg-emerald-600 px-16 text-base font-black tracking-widest">
                  SUBMIT GRADE
                </Button>

                <Button
                  variant="outline"
                  class="h-[60px] border-zinc-800 bg-zinc-900/50 px-9 text-base font-bold tracking-wider text-zinc-300 uppercase"
                >
                  NEXT STUDENT
                </Button>
              </div>
            </div>
          </div>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </Resizable.Pane>

    <Resizable.Handle />

    <Resizable.Pane defaultSize={25} minSize={20} class="flex flex-col border-l border-emerald-950 bg-zinc-950">
      <div class="border-b border-emerald-950 bg-zinc-900/50 p-6">
        <div class="mb-4 flex items-center gap-2 text-zinc-100">
          <IdentificationCard size={20} />
          <h3 class="text-xs font-black tracking-widest uppercase">Test Bench</h3>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <Label class="text-[9px] text-zinc-500 uppercase">CPU (s)</Label>
            <Input
              type="number"
              step="0.1"
              bind:value={cpuTimeLimit}
              class="h-8 border-emerald-900/50 bg-zinc-900 text-xs text-white"
            />
          </div>
          <div class="space-y-1">
            <Label class="text-[9px] text-zinc-500 uppercase">Mem (KB)</Label>
            <Input
              type="number"
              step="1024"
              bind:value={memoryLimit}
              class="h-8 border-emerald-900/50 bg-zinc-900 text-xs text-white"
            />
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto bg-zinc-950">
        <Table.Root>
          <Table.Header class="sticky top-0 z-10 bg-zinc-900">
            <Table.Row class="border-emerald-950">
              <Table.Head class="w-10 px-2 text-center text-[10px] text-zinc-500 uppercase">Status</Table.Head>
              <Table.Head class="px-2 text-[10px] text-zinc-500 uppercase">Case Data</Table.Head>
              <Table.Head class="w-10"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row class="border-emerald-950/50 bg-emerald-500/5">
              <Table.Cell class="px-2 py-3" colspan={2}>
                <div class="flex flex-col gap-2">
                  <Input
                    bind:value={newInput}
                    placeholder="Input..."
                    class="h-7 border-zinc-800 bg-zinc-900 text-[10px] text-white"
                  />
                  <Input
                    bind:value={newExpected}
                    placeholder="Expect..."
                    class="h-7 border-zinc-800 bg-zinc-900 text-[10px] text-white"
                    onkeydown={(e) => e.key === 'Enter' && addTestCase()}
                  />
                </div>
              </Table.Cell>
              <Table.Cell class="text-center">
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-8 w-8 text-emerald-500 hover:bg-emerald-500/20"
                  onclick={addTestCase}><Plus size={16} /></Button
                >
              </Table.Cell>
            </Table.Row>

            {#each testCases as test (test.id)}
              <Table.Row class="group border-emerald-950/30 hover:bg-white/5">
                <Table.Cell class="text-center">
                  {#if test.status === 'running'}
                    <Loader2 class="mx-auto h-3 w-3 animate-spin text-emerald-500" />
                  {:else if test.result?.status.id === 3}
                    <CheckCircle2 class="mx-auto h-4 w-4 text-emerald-500" />
                  {:else if test.result}
                    <XCircle class="mx-auto h-4 w-4 text-red-500" />
                  {:else}
                    <div class="mx-auto h-2 w-2 rounded-full bg-zinc-800"></div>
                  {/if}
                </Table.Cell>
                <Table.Cell class="px-2 py-3">
                  <div class="flex flex-col font-mono text-[10px]">
                    <span class="text-zinc-400">IN: {test.input}</span>
                    <span class="text-emerald-500/70">EX: {test.expected}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-zinc-600 hover:text-red-500"
                    onclick={() => removeTestCase(test.id)}><Trash2 size={14} /></Button
                  >
                </Table.Cell>
              </Table.Row>
              {#if test.result && test.result.status.id !== 3}
                <Table.Row class="border-none bg-red-500/5">
                  <Table.Cell colspan={3} class="px-4 py-2">
                    <div class="rounded bg-black/40 p-2 font-mono text-[9px] break-all text-red-400">
                      <strong>GOT:</strong>
                      {test.result.stdout || test.result.stderr || 'No output'}
                    </div>
                  </Table.Cell>
                </Table.Row>
              {/if}
            {/each}
          </Table.Body>
        </Table.Root>
      </div>

      <div class="border-t border-emerald-950 bg-zinc-900/50 p-6">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-black tracking-widest text-zinc-500 uppercase">PASSED</span>
          <span class="text-xl font-black text-emerald-500">{passCount} / {testCases.length}</span>
        </div>
      </div>
    </Resizable.Pane>
  </Resizable.PaneGroup>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
    background-color: #000;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
