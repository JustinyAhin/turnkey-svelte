<script>
	import {
		PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
		PUBLIC_TURNKEY_ORGANIZATION_ID
	} from '$env/static/public';
	import AuthDashboard from '$lib/components/dashboard/index.svelte';

	const config = {
		googleClientId: PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
		redirectURI: 'http://localhost:5173/',
		turnkeyConfig: {
			apiBaseUrl: 'https://api.turnkey.com',
			defaultOrganizationId: PUBLIC_TURNKEY_ORGANIZATION_ID
		}
	};
</script>

<AuthDashboard
	googleClientId={config.googleClientId}
	redirectURI={config.redirectURI}
	turnkeyConfig={config.turnkeyConfig}
/>
