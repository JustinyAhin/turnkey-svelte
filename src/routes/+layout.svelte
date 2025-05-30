<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import { turnkeyState } from '$lib/states/turnkey/turnkey-state.svelte';


	let { children } = $props();

	onMount(async () => {
		await turnkeyState.initTurnkey();
	});
</script>

<Toaster richColors />

{@render children()}
