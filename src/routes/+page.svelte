<script lang="ts">
	import GoogleLogin from '$lib/components/GoogleLogin.svelte';
	import { StorageKeys } from '@turnkey/sdk-browser';
	import { turnkeyState } from '$lib/client/states/turnkey/turnkey-state.svelte';
	import { clearStorageItem } from '$lib/client/storage/local-storage';
	import { Button } from '$lib/components/ui/button';

	const decodeJwtPayload = (token: string) => {
		try {
			const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
			const json = atob(base64);
			return JSON.parse(json);
		} catch {
			return null;
		}
	};

	const logout = () => {
		clearStorageItem(StorageKeys.Session);
		clearStorageItem(StorageKeys.Client);

		turnkeyState.updateState({});
		// option: hard reload to clear state
		location.href = '/';
	};

	// decode token whenever session changes
	let payload = $derived(
		turnkeyState.value.session ? decodeJwtPayload(turnkeyState.value.session) : null
	);
</script>

{#if turnkeyState.value.session}
	{#if payload}
		<div class="space-y-2 p-4">
			<p class="text-green-600">✅ Logged in!</p>
			<pre class="overflow-auto rounded bg-gray-100 p-2 text-sm">{JSON.stringify(
					payload,
					null,
					2
				)}</pre>
			<Button class="mt-2 rounded border px-4 py-2" onclick={logout}>Logout</Button>
		</div>
	{:else}
		<p class="p-4">Logged in, but could not decode session token.</p>
		<Button class="rounded border px-4 py-2" onclick={logout}>Logout</Button>
	{/if}
{:else}
	<div class="p-4">
		<GoogleLogin />
	</div>
{/if}
