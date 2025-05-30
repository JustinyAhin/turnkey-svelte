<script lang="ts">
	import TurnkeyProvider from '$lib/providers/turnkey-provider.svelte';
	import DashboardContent from './content.svelte';

	interface Props {
		googleClientId: string;
		redirectURI: string;
		turnkeyConfig: {
			apiBaseUrl: string;
			defaultOrganizationId: string;
			// Add other Turnkey config properties as needed
		};
	}

	let { googleClientId, redirectURI, turnkeyConfig }: Props = $props();
</script>

<TurnkeyProvider config={turnkeyConfig}>
	<DashboardContent {googleClientId} {redirectURI} />
</TurnkeyProvider>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #f8fafc;
	}
</style>
