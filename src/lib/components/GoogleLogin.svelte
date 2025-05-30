<script lang="ts">
	import { tk } from '$lib/stores/turnkey';
	import { sha256 } from '@noble/hashes/sha2';
	import { bytesToHex } from '@noble/hashes/utils';
	import { goto } from '$app/navigation';
	import { PUBLIC_GOOGLE_OAUTH_CLIENT_ID } from '$env/static/public';
	import { page } from '$app/state';

	let loading = $state(false);
	let hasProcessedIdToken = $state(false);

	const getIdTokenFromUrl = () => {
		const hash = page.url.hash.split('=')[1];
		if (hash) {
			const hashParts = hash.split('&');
			return hashParts[0];
		}
	};

	const validateIdToken = (token: string): boolean => {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const storedNonce = sessionStorage.getItem('google_oauth_nonce');
			return payload.nonce === storedNonce && payload.exp > Date.now() / 1000;
		} catch {
			return false;
		}
	};

	/**
	 * When we come back from Google the id_token is in the hash fragment.
	 * This runs on mount and whenever location.hash changes.
	 */
	$effect(() => {
		if (typeof window === 'undefined') return;

		const oidcToken = getIdTokenFromUrl();

		if (oidcToken && !hasProcessedIdToken) {
			if (!validateIdToken(oidcToken)) {
				console.error('Invalid id token');
				return;
			}

			finishLogin(oidcToken);
		}
	});

	const finishLogin = async (oidcToken: string) => {
		try {
			const { indexedDb } = $tk;
			if (!indexedDb) return;

			loading = true;

			// Use the same keypair generated before redirect to keep nonce consistent
			const publicKey = await indexedDb.getPublicKey();

			const res = await fetch('/api/turnkey/google', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ oidcToken, publicKey })
			});

			if (!res.ok) {
				loading = false;
				console.error('Turnkey login failed');
				return;
			}

			const { session } = await res.json();

			const { turnkey } = $tk;
			await indexedDb.loginWithSession(session);

			tk.set({ turnkey, indexedDb, session });
			loading = false;

			hasProcessedIdToken = true;

			window.location.hash = '';
			goto('/');
		} catch (error) {
			console.error('Failed to login', error);
			loading = false;

			hasProcessedIdToken = true;
		}
	};

	const getGoogleAuthUrl = (nonce: string): string => {
		const params = new URLSearchParams({
			client_id: PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
			redirect_uri: page.url.origin,
			response_type: 'id_token',
			scope: 'openid email profile',
			nonce: nonce,
			prompt: 'select_account'
		});

		return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	};

	const startLogin = async () => {
		const { indexedDb } = $tk;
		if (!indexedDb) return;

		await indexedDb.resetKeyPair();
		const publicKey = await indexedDb.getPublicKey();

		const nonce = bytesToHex(sha256(publicKey as string));
		const url = getGoogleAuthUrl(nonce);

		sessionStorage.setItem('google_oauth_nonce', nonce);

		window.location.href = url.toString();
	};
</script>

<button
	class="flex items-center gap-2 rounded border px-4 py-2"
	disabled={loading}
	onclick={startLogin}
>
	{#if loading}
		<span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"
		></span>
		Signing in…
	{:else}
		<svg class="size-4" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="currentColor"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="currentColor"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			/>
			<path
				fill="currentColor"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
		<span>Continue with Google</span>
	{/if}
</button>
