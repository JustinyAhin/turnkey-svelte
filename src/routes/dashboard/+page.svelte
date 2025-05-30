<script lang="ts">
	import Dashboard from '$lib/components/sections/dashboard.svelte';
	import { useTurnkey } from '$lib/turnkey';
	import { goto } from '$app/navigation';

	const { turnkey, isReady } = useTurnkey();

	// Check authentication on page load
	$effect(() => {
		if (isReady && turnkey) {
			checkAuthentication();
		}
	});

	async function checkAuthentication() {
		try {
			const session = await turnkey!.getSession();
			if (!session) {
				goto('/');
			}
		} catch (error) {
			console.error('Authentication check failed:', error);
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Turnkey Auth Demo</title>
	<meta name="description" content="User dashboard for Turnkey authentication demo" />
</svelte:head>

<Dashboard />
