<script lang="ts">
	import GoogleLogin from '$lib/components/GoogleLogin.svelte';
	import { tk } from '$lib/stores/turnkey';
	import { StorageKeys } from '@turnkey/sdk-browser';

	const decodeJwtPayload = (token: string) => {
		try {
			const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
			const json = atob(base64);
			return JSON.parse(json);
		} catch {
			return null;
		}
	};

	function logout() {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(StorageKeys.Session);
			localStorage.removeItem(StorageKeys.Client);
		}
		tk.set({});
		// option: hard reload to clear state
		location.href = '/';
	}

	// decode token whenever session changes
	let payload = $derived($tk.session ? decodeJwtPayload($tk.session) : null);
</script>

{#if $tk.session}
	{#if payload}
		<div class="space-y-2 p-4">
			<p class="text-green-600">✅ Logged in!</p>
			<pre class="overflow-auto rounded bg-gray-100 p-2 text-sm">{JSON.stringify(
					payload,
					null,
					2
				)}</pre>
			<button class="mt-2 rounded border px-4 py-2" onclick={logout}>Logout</button>
		</div>
	{:else}
		<p class="p-4">Logged in, but could not decode session token.</p>
		<button class="rounded border px-4 py-2" onclick={logout}>Logout</button>
	{/if}
{:else}
	<div class="p-4">
		<GoogleLogin />
	</div>
{/if}
