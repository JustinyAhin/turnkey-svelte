<script lang="ts">
  import GoogleLogin from '$lib/components/GoogleLogin.svelte';
  import { tk } from '$lib/stores/turnkey';
</script>

{#if $tk.session}
  <p class="text-green-600 p-4">✅ Logged in with Turnkey!</p>
{:else}
  <div class="p-4">
    <GoogleLogin />
  </div>
{/if}
