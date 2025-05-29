<script lang="ts">
	import { page } from '$app/state';
	import { turnkeyState } from '$lib/client/states/turnkey/turnkey-state.svelte';
	import { authState } from '$lib/client/states/auth/auth-state.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import GoogleOauth from '$lib/components/google-oauth.svelte';

	const getIdTokenFromUrl = () => {
		const hash = page.url.hash.split('=')[1];
		if (hash) {
			const hashParts = hash.split('&');
			return hashParts[0];
		}
	};

	// Google OAuth
	let turnkeyIsReady = $derived(turnkeyState.isReady);
	let hasProcessedIdToken = false;

	const validateIdToken = (token: string): boolean => {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const storedNonce = sessionStorage.getItem('google_oauth_nonce');
			return payload.nonce === storedNonce && payload.exp > Date.now() / 1000;
		} catch {
			return false;
		}
	};

	$effect(() => {
		const idToken = getIdTokenFromUrl();

		if (idToken && turnkeyIsReady && !hasProcessedIdToken) {
			if (!validateIdToken(idToken)) {
				console.error('Invalid or expired token');
				return;
			}
			hasProcessedIdToken = true;

			authState
				.loginWithOAuth({
					credential: idToken,
					providerName: 'Google Auth - Embedded Wallet'
				})
				.then(() => {
					// Clear hash before navigation
					window.location.hash = '';
					goto('/');
				})
				.catch((error) => {
					console.error('[effect] Error logging in with Google OAuth', error);
					// Clear hash even on error to prevent infinite loop
					window.location.hash = '';
				});
		}
	});
</script>

<svelte:head>
	<title>Turnkey - Embedded Wallet</title>
</svelte:head>

<div class="max-w-5xl mx-auto py-8 space-y-12">
	{#if authState.isLoggedIn}
		<div class="space-y-8">
			<Button class="cursor-pointer" onclick={() => authState.logout()}>Logout</Button>

			<details open>
				<summary class="cursor-pointer text-sm text-gray-500">Debug: Session Data</summary>

				<div class="space-y-4">
					<pre class="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs">
						{JSON.stringify(authState.value, null, 2)}
					</pre>

					<pre class="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs">
						{JSON.stringify(turnkeyState.value, null, 2)}
					</pre>
				</div>
			</details>
		</div>
	{:else}
		<GoogleOauth />
	{/if}
</div>
