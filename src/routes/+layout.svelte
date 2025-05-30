<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import { initTurnkey } from '$lib/turnkey/init';

	let { children } = $props();

	onMount(initTurnkey);
</script>

<Toaster richColors />

{@render children()}
