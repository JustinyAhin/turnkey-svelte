<script lang="ts">
	import Auth from '$lib/components/sections/auth.svelte';
	import { goto } from '$app/navigation';
	import { useTurnkey } from '$lib/turnkey';

	const { turnkey, isReady } = useTurnkey();

	// Check for existing session and redirect if logged in
	$effect(() => {
		if (isReady && turnkey) {
			checkSession();
		}
	});

	async function checkSession() {
		try {
			const session = await turnkey!.getSession();
			if (session) {
				goto('/dashboard');
			}
		} catch (error) {
			console.error('Session check failed:', error);
		}
	}

	function handleAuthSuccess() {
		goto('/dashboard');
	}

	function handleAuthError(error: string) {
		console.error('Authentication error:', error);
		// You could show a toast notification here
	}
</script>

<svelte:head>
	<title>Turnkey Auth Demo - Svelte</title>
	<meta name="description" content="Turnkey authentication demo using Svelte 5 and Google OAuth" />
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
>
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
				<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 112 25">
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
			</div>
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Turnkey Demo</h1>
			<p class="text-gray-600">Secure authentication with Svelte 5</p>
		</div>

		<!-- Auth Component -->
		<Auth onAuthSuccess={handleAuthSuccess} onError={handleAuthError} />

		<!-- Features -->
		<div class="mt-8 text-center">
			<div class="grid grid-cols-1 gap-4 text-sm text-gray-600">
				<div class="flex items-center justify-center gap-2">
					<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Secure OAuth authentication</span>
				</div>
				<div class="flex items-center justify-center gap-2">
					<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Built with Svelte 5 runes</span>
				</div>
				<div class="flex items-center justify-center gap-2">
					<svg class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Powered by Turnkey</span>
				</div>
			</div>
		</div>
	</div>
</div>
