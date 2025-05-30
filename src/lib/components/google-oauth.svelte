<script lang="ts">
	import {
		createGoogleAuthState,
		type OidcTokenParams
	} from '$lib/client/states/google-oauth/google-oauth-state.svelte';
	import { getTurnkeyContext } from '$lib/client/states/turnkey/turnkey-state-new.svelte';

	interface Props {
		clientId: string;
		redirectURI: string;
		onSuccess?: (result: any) => void;
		onError?: (error: string) => void;
		showLabel?: boolean;
		disabled?: boolean;
	}

	let {
		clientId,
		redirectURI,
		onSuccess,
		onError,
		showLabel = true,
		disabled = false
	}: Props = $props();

	// Get Turnkey context
	const turnkey = getTurnkeyContext();

	// Create Google auth state
	const googleAuth = createGoogleAuthState();

	// Check if Google is already connected
	let isGoogleConnected = $state(false);
	let userInfo = $state<any>(null);

	// Check Google connection status
	$effect(() => {
		if (turnkey.session && userInfo) {
			isGoogleConnected =
				userInfo.oauthProviders?.some((provider: { issuer: string }) =>
					provider.issuer.toLowerCase().includes('google')
				) || false;
		}
	});

	const handleLoadingUserInfo = async () => {
		if (turnkey.indexedDbClient && turnkey.session) {
			try {
				const userResponse = await turnkey.indexedDbClient.getUser({
					userId: turnkey.session.authClient || ''
				});
				userInfo = userResponse.user;
			} catch (error) {
				console.error('Failed to load user info:', error);
			}
		}
	};

	// Load user info when session changes
	$effect(() => {
		handleLoadingUserInfo();
	});

	async function handleGoogleSignIn() {
		if (!turnkey.indexedDbClient || !clientId || !redirectURI) {
			const errorMsg = 'Missing required configuration or Turnkey client not ready';
			googleAuth.clearError();
			onError?.(errorMsg);
			return;
		}

		try {
			// Get public key for nonce generation
			const publicKey = await turnkey.indexedDbClient.getPublicKey();
			if (!publicKey) {
				throw new Error('Public key not available');
			}

			const config: OidcTokenParams = {
				publicKey,
				clientId,
				redirectURI
			};

			const result = await googleAuth.signInWithGoogle(config);

			if (!result) {
				throw new Error('Failed to get Google OAuth token');
			}

			// Check if this Google account is already connected to another account
			// const suborgs = await server.getSuborgs({
			// 	filterType: 'OIDC_TOKEN',
			// 	filterValue: result.idToken
			// });
			const response = await fetch('/api/turnkey-oauth', {
				method: 'POST',
				body: JSON.stringify({ oidcToken: result.idToken })
			});

			if (!response.ok) {
				throw new Error(
					'Failed to check if Google account is already connected to another account'
				);
			}

			const suborgs = await response.json();

			console.log('suborgs', suborgs);

			if (suborgs && suborgs?.organizationIds?.length > 0) {
				throw new Error('Google account is already connected to another account');
			}

			// Create OAuth provider in Turnkey
			await turnkey.indexedDbClient.createOauthProviders({
				userId: userInfo?.userId || '',
				oauthProviders: [
					{
						providerName: `Google - ${Date.now()}`,
						oidcToken: result.idToken
					}
				]
			});

			// Update user info
			googleAuth.setUserInfo({ ...userInfo, hasGoogleAuth: true });
			isGoogleConnected = true;

			onSuccess?.(result);

			// Refresh the page to update the UI
			if (typeof window !== 'undefined') {
				window.location.reload();
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			onError?.(errorMessage);
		}
	}
</script>

<div class="google-auth-container">
	{#if isGoogleConnected}
		<!-- Already connected state -->
		<div class="login-method-row connected">
			<div class="label-container">
				<img src="/google.svg" alt="Google" class="icon-small" />
				{#if showLabel}
					<span class="method-label">Google</span>
				{/if}
				<span class="connection-status">Connected</span>
			</div>
			<div class="check-icon">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M7.5 13.475L4.025 10L2.975 11.05L7.5 15.575L17.5 5.575L16.45 4.525L7.5 13.475Z"
						fill="#4c48ff"
					/>
				</svg>
			</div>
		</div>
	{:else}
		<!-- Not connected state -->
		<div class="login-method-row">
			<div class="label-container">
				<img src="/google.svg" alt="Google" class="icon-small" />
				{#if showLabel}
					<span class="method-label">Google</span>
				{/if}
			</div>
			<button
				class="add-button"
				onclick={handleGoogleSignIn}
				disabled={disabled || googleAuth.isLoading}
				title="Connect Google account"
			>
				{#if googleAuth.isLoading}
					<div class="spinner"></div>
				{:else}
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path
							d="M10 4.5C10.5523 4.5 11 4.94772 11 5.5V9H14.5C15.0523 9 15.5 9.44772 15.5 10C15.5 10.5523 15.0523 11 14.5 11H11V14.5C11 15.0523 10.5523 15.5 10 15.5C9.44772 15.5 9 15.0523 9 14.5V11H5.5C4.94772 11 4.5 10.5523 4.5 10C4.5 9.44772 4.94772 9 5.5 9H9V5.5C9 4.94772 9.44772 4.5 10 4.5Z"
							fill="currentColor"
						/>
					</svg>
				{/if}
			</button>
		</div>
	{/if}

	{#if googleAuth.error}
		<div class="error-message">
			{googleAuth.error}
		</div>
	{/if}
</div>

<style>
	.google-auth-container {
		width: 100%;
	}

	.login-method-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.login-method-row.connected {
		opacity: 0.8;
	}

	.label-container {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon-small {
		width: 20px;
		height: 20px;
	}

	.method-label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.connection-status {
		font-size: 12px;
		color: #6b7280;
		background: #f3f4f6;
		padding: 2px 8px;
		border-radius: 12px;
	}

	.add-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-button:hover:not(:disabled) {
		background: #f3f4f6;
		color: #374151;
	}

	.add-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.check-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #4c48ff;
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

	.error-message {
		margin-top: 8px;
		padding: 8px 12px;
		background: #fef2f2;
		color: #dc2626;
		border-radius: 6px;
		font-size: 14px;
		border: 1px solid #fecaca;
	}
</style>
