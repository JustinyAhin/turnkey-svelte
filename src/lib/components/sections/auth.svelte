<script lang="ts">
	import {
		useTurnkey,
		createGoogleAuthUrl,
		openGoogleAuthPopup,
		generateNonce
	} from '$lib/turnkey';
	import { PUBLIC_GOOGLE_OAUTH_CLIENT_ID } from '$env/static/public';
	import { goto } from '$app/navigation';

	interface AuthProps {
		onAuthSuccess?: () => void;
		onError?: (error: string) => void;
	}

	let { onAuthSuccess, onError }: AuthProps = $props();

	const { turnkey, indexedDbClient, isReady } = useTurnkey();

	let loading = $state(false);
	let error = $state<string | null>(null);

	// Check for existing session on mount
	$effect(() => {
		if (isReady && turnkey) {
			checkExistingSession();
		}
	});

	async function checkExistingSession() {
		try {
			const session = await turnkey!.getSession();
			if (session) {
				onAuthSuccess?.();
			}
		} catch (err) {
			console.error('Session check failed:', err);
		}
	}

	async function handleGoogleLogin() {
		if (!indexedDbClient) {
			error = 'Authentication not ready. Please try again.';
			return;
		}

		loading = true;
		error = null;

		try {
			// Reset key pair and get public key
			await indexedDbClient.resetKeyPair();
			const publicKey = await indexedDbClient.getPublicKey();

			if (!publicKey) {
				throw new Error('Failed to generate public key');
			}

			// Generate nonce and create auth URL
			const nonce = generateNonce(publicKey);
			const authUrl = createGoogleAuthUrl({
				clientId: PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
				redirectUri: '/',
				nonce
			});

			// Open popup and wait for result
			const { idToken } = await openGoogleAuthPopup(authUrl);

			// Mock server call to verify token and create session
			// In real implementation, this would call your Turnkey server
			const mockSession = {
				token: idToken,
				publicKey,
				organizationId: 'mock_org_id',
				userId: 'mock_user_id',
				expiry: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
			};

			// Store session
			await indexedDbClient.loginWithSession(mockSession);

			onAuthSuccess?.();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
			error = errorMessage;
			onError?.(errorMessage);
			console.error('Google login failed:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto w-full max-w-md">
	<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
		<h2 class="mb-6 text-center text-2xl font-bold text-gray-900">Log in or sign up</h2>

		<div class="space-y-4">
			<!-- Google OAuth Button -->
			<button
				onclick={handleGoogleLogin}
				disabled={loading || !isReady}
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if loading}
					<div
						class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
					></div>
					<span>Connecting...</span>
				{:else}
					<svg class="h-5 w-5" viewBox="0 0 24 24">
						<path
							fill="#4285f4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34a853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#fbbc05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#ea4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					<span>Continue with Google</span>
				{/if}
			</button>

			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}

			<div class="text-center">
				<p class="text-xs text-gray-500">
					By continuing, you agree to our
					<a
						href="https://www.turnkey.com/legal/terms"
						target="_blank"
						class="text-blue-600 hover:underline"
					>
						Terms of Service
					</a>
					&
					<a
						href="https://www.turnkey.com/legal/privacy"
						target="_blank"
						class="text-blue-600 hover:underline"
					>
						Privacy Policy
					</a>
				</p>
			</div>

			<button
				class="flex cursor-pointer items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700"
				onclick={() => window.open('https://www.turnkey.com/', '_blank')}
			>
				<span>Secured by</span>
				<svg class="h-4 w-16" viewBox="0 0 112 25" fill="currentColor">
					<path
						d="M6.91261 9.4805L11.7161 20.1256H1L5.80344 9.4805C5.85222 9.37315 5.93037 9.28218 6.02867 9.21844C6.12696 9.15468 6.24128 9.12079 6.35802 9.12079C6.47477 9.12079 6.58907 9.15468 6.68737 9.21844C6.78566 9.28218 6.86383 9.37315 6.91261 9.4805Z"
					/>
					<path
						d="M6.35745 7.83055C8.22116 7.83055 9.73198 6.30148 9.73198 4.41529C9.73198 2.52907 8.22116 1 6.35745 1C4.49373 1 2.98291 2.52907 2.98291 4.41529C2.98291 6.30148 4.49373 7.83055 6.35745 7.83055Z"
					/>
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M68.342 1H68.561H70.851H71.0701V1.22138V12.9429V15.753V19.2244V19.4458H70.851H68.561H68.342V19.2244V1.22138V1Z"
					/>
				</svg>
			</button>
		</div>
	</div>
</div>
