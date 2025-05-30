<script lang="ts">
	import GoogleAuth from '$lib/components/google-oauth.svelte';
	import { getTurnkeyContext } from '$lib/client/states/turnkey/turnkey-state.svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		googleClientId: string;
		redirectURI: string;
	}

	let { googleClientId, redirectURI }: Props = $props();

	const turnkey = getTurnkeyContext();

	let isLoading = $state(true);
	let user = $state<any>(null);
	let hasInitialized = $state(false);

	// Initialize dashboard data when dependencies are ready
	$effect(() => {
		if (turnkey.indexedDbClient && turnkey.session && !hasInitialized) {
			hasInitialized = true;

			// Use setTimeout to break out of reactive context
			setTimeout(async () => {
				try {
					const userResponse = await turnkey.indexedDbClient?.getUser({
						userId: turnkey.session!.authClient || ''
					});
					user = userResponse?.user;
				} catch (error) {
					console.error('Failed to load user:', error);
					toast.error('Failed to load user information');
					// Reset flag to allow retry
					hasInitialized = false;
				} finally {
					isLoading = false;
				}
			}, 0);
		} else if (!turnkey.indexedDbClient || !turnkey.session) {
			// Reset if dependencies become unavailable
			hasInitialized = false;
			isLoading = true;
		}
	});

	async function handleLogout() {
		try {
			await turnkey.turnkey?.logout();
			await turnkey.indexedDbClient?.resetKeyPair();

			// Redirect to login page or refresh
			if (typeof window !== 'undefined') {
				window.location.href = '/';
			}
		} catch (error) {
			console.error('Logout failed:', error);
			toast.error('Failed to logout');
		}
	}

	function handleGoogleSuccess(result: any) {
		toast.success('Google account connected successfully!');
	}

	function handleGoogleError(error: string) {
		toast.error(error);
	}
</script>

{#if isLoading}
	<div class="loading-container">
		<div class="spinner-large"></div>
		<p>Loading dashboard...</p>
	</div>
{:else}
	<main class="dashboard-main">
		<nav class="navbar">
			<div class="nav-content">
				<h1 class="nav-title">Turnkey Dashboard</h1>
				<button class="logout-btn" onclick={handleLogout}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path
							d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 5L13 8M13 8L10 11M13 8H6"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Logout
				</button>
			</div>
		</nav>

		<div class="dashboard-container">
			<div class="dashboard-card">
				<h2 class="card-title">Authentication Methods</h2>
				<div class="auth-methods">
					<GoogleAuth
						clientId={googleClientId}
						{redirectURI}
						onSuccess={handleGoogleSuccess}
						onError={handleGoogleError}
					/>
				</div>
			</div>

			<div class="dashboard-card">
				<h2 class="card-title">Account Information</h2>
				<div class="account-info">
					{#if user}
						<div class="info-row">
							<span class="info-label">User ID:</span>
							<span class="info-value">{user.userId || 'N/A'}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Email:</span>
							<span class="info-value">{user.userEmail || 'Not connected'}</span>
						</div>
						<div class="info-row">
							<span class="info-label">OAuth Providers:</span>
							<span class="info-value">{user.oauthProviders?.length || 0} connected</span>
						</div>
					{:else}
						<p>No user information available</p>
					{/if}
				</div>
			</div>
		</div>
	</main>
{/if}

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #f8fafc;
	}

	.dashboard-main {
		min-height: 100vh;
		background-color: #f8fafc;
	}

	.navbar {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 0 20px;
	}

	.nav-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.nav-title {
		font-size: 20px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		color: #475569;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s ease;
	}

	.logout-btn:hover {
		background: #e2e8f0;
		color: #334155;
	}

	.dashboard-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px 20px;
		display: grid;
		gap: 24px;
		grid-template-columns: 1fr;
	}

	.dashboard-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
	}

	.card-title {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 20px 0;
	}

	.auth-methods {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.account-info {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-weight: 500;
		color: #475569;
	}

	.info-value {
		color: #64748b;
		font-family: monospace;
		font-size: 14px;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		gap: 16px;
		color: #64748b;
	}

	.spinner-large {
		width: 32px;
		height: 32px;
		border: 3px solid #e2e8f0;
		border-top: 3px solid #4c48ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (min-width: 768px) {
		.dashboard-container {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
