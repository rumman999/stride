<script>
  import { onMount } from "svelte";

  let submissions = $state([]);
  let selected = $state(null);
  let details = $state(null);
  let loading = $state(false);

  function loadTokens() {
    submissions = JSON.parse(localStorage.getItem("judge0_tokens") || "[]");
  }

  async function fetchDetails(token) {
    loading = true;
    selected = token;
    details = null;

    try {
      const res = await fetch(
        `http://localhost:2358/submissions/${token}?base64_encoded=true`
      );
      const data = await res.json();

      const decode = (str) => str ? atob(str) : "";

      details = {
        stdout: decode(data.stdout),
        stderr: decode(data.stderr),
        compile_output: decode(data.compile_output),
        status: data.status?.description
      };
    } catch (e) {
      details = { error: "Failed to fetch details" };
    }

    loading = false;
  }

  onMount(loadTokens);
</script>

<div class="p-6 space-y-4">
  <h1 class="text-2xl font-bold">Submissions</h1>

  <div class="grid grid-cols-2 gap-4">
    <!-- List -->
    <div class="border rounded p-2 space-y-2">
      {#each submissions as sub}
        <div
          class="p-2 border rounded cursor-pointer hover:bg-gray-100"
          on:click={() => fetchDetails(sub.token)}
        >
          <div class="text-sm font-mono">{sub.token}</div>
          <div class="text-xs text-gray-500">
            {new Date(sub.time).toLocaleString()}
          </div>
        </div>
      {/each}
    </div>

    <!-- Details -->
    <div class="border rounded p-4">
      {#if loading}
        <p>Loading...</p>
      {:else if details}
        <p><b>Status:</b> {details.status}</p>

        <div class="mt-2">
          <p class="font-semibold">Stdout:</p>
          <pre class="bg-gray-100 p-2 rounded">{details.stdout}</pre>
        </div>

        <div class="mt-2">
          <p class="font-semibold">Stderr:</p>
          <pre class="bg-gray-100 p-2 rounded">{details.stderr}</pre>
        </div>

        <div class="mt-2">
          <p class="font-semibold">Compile Output:</p>
          <pre class="bg-gray-100 p-2 rounded">{details.compile_output}</pre>
        </div>
      {:else}
        <p>Select a submission</p>
      {/if}
    </div>
  </div>
</div>
