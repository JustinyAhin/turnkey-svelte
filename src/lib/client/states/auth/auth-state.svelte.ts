import { browser } from '$app/environment';
import { authStorage, TOKEN_KEY, USER_KEY, WALLETS_KEY } from '$lib/client/storage/auth';
import { turnkeyState } from '$lib/client/states/turnkey/turnkey-state.svelte';
import { TurnkeyBrowserClient } from '@turnkey/sdk-browser';
import { snsLogin } from './api';
import type { AuthState, TurnkeyWallet, User } from './types';
import { addUserDataToStorage, getSelectedWallet } from './utils';
import {
	PUBLIC_TURNKEY_ORGANIZATION_ID,
	PUBLIC_TURNKEY_PROXY_API_BASE_URL
} from '$env/static/public';

const SESSION_EXPIRY = (60 * 60 * 24 * 7).toString(); // 7 days in seconds

const DEFAULT_AUTH_STATE: AuthState = {
	loading: false,
	error: '',
	walletsLoading: false,
	walletsError: '',
	user: null,
	sessionExpiring: false,
	wallets: [],
	selectedWallet: null,
	accessToken: null,
	isAuthenticatingZipperBackend: false
};

const createAuthState = () => {
	let state = $state(DEFAULT_AUTH_STATE);
	let isInitialized = false;

	const updateState = (updates: Partial<AuthState>) => {
		state = {
			...state,
			...updates
		};
	};

	const initializeAuth = async () => {
		if (!browser || isInitialized) {
			console.log(
				'[authState/initializeAuth] Skipping initialization - not in browser or already initialized'
			);
			return;
		}

		try {
			console.log('[authState/initializeAuth] Initializing auth state from storage');

			// Load all data from storage in parallel
			const [user, wallets, accessToken] = await Promise.all([
				authStorage.get<User>(USER_KEY),
				authStorage.get<TurnkeyWallet[]>(WALLETS_KEY),
				authStorage.get<string>(TOKEN_KEY)
			]);

			// Update state with loaded data
			const newState: Partial<AuthState> = {
				user: user ?? null,
				wallets: wallets ?? [],
				accessToken: accessToken ?? null
			};

			// Only set selectedWallet if we have user and wallets
			if (user && wallets && wallets.length > 0) {
				newState.selectedWallet = getSelectedWallet({
					auth: { ...state, ...newState } as AuthState,
					wallets
				});
			}

			updateState(newState);
			isInitialized = true;
		} catch (error) {
			console.error('[authState/initializeAuth] Failed to initialize auth state:', error);
		}
	};

	const loginWithOAuth = async ({
		credential,
		providerName
	}: {
		credential: string;
		providerName: string;
	}) => {
		updateState({ loading: true, error: '' });

		try {
			const { authIframeClient, indexDbClient } = turnkeyState.value;
			if (!authIframeClient?.iframePublicKey) {
				throw new Error('Iframe client not initialized');
			}

			// Call SNS login
			const snsResponse = await snsLogin({
				providerName,
				credential,
				iframePublicKey: authIframeClient.iframePublicKey
			});

			if (!snsResponse) {
				throw new Error('SNS login failed - no response');
			}

			const { oauthResponse, wallets, user, accessToken } = snsResponse;

			// Check what type of response we got
			if (accessToken) {
				await indexDbClient?.loginWithSession(accessToken);
			} else if (oauthResponse?.credentialBundle) {
				// Create a TurnkeyBrowserClient instance to use loginWithBundle
				const browserClient = new TurnkeyBrowserClient({
					apiBaseUrl: 'https://api.turnkey.com',
					defaultOrganizationId: PUBLIC_TURNKEY_ORGANIZATION_ID,
					serverSignUrl: `${PUBLIC_TURNKEY_PROXY_API_BASE_URL}/api/proxy/turnkey/sign`
				});

				await browserClient.loginWithBundle({
					bundle: oauthResponse.credentialBundle,
					expirationSeconds: SESSION_EXPIRY,
					targetPublicKey: authIframeClient.iframePublicKey
				});

				// Inject into iframe client so it can make authenticated requests
				await authIframeClient.injectCredentialBundle(oauthResponse.credentialBundle);
			} else {
				throw new Error('Invalid OAuth response - no token or bundle');
			}

			// Save user data to storage
			await addUserDataToStorage({
				token: accessToken,
				user,
				wallets
			});

			// Update state with the new data from SNS response
			const newState: Partial<AuthState> = {
				user: user ?? null,
				wallets: wallets ?? [],
				accessToken: accessToken ?? null,
				loading: false,
				error: ''
			};

			// Create selected wallet AFTER we have all the auth data
			if (user && wallets && wallets.length > 0) {
				newState.selectedWallet = getSelectedWallet({
					auth: { ...state, ...newState } as AuthState,
					wallets
				});
			}

			updateState(newState);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'OAuth login failed';
			console.error('[authState/loginWithOAuth] Login error:', error);
			updateState({ error: message, loading: false });
			throw error;
		}
	};

	const logout = async () => {
		updateState(DEFAULT_AUTH_STATE);
		await authStorage.clear();

		// Logout from the main turnkey instance if available
		const { turnkey } = turnkeyState.value;
		if (turnkey) {
			await turnkey.logout();
		}

		isInitialized = false;
	};

	// Auto-initialize when in browser and turnkey is ready
	$effect.root(() => {
		$effect(() => {
			if (browser && !isInitialized && turnkeyState.isReady) {
				console.log('[authState] Auto-initializing auth state');

				initializeAuth();
			}
		});
	});

	return {
		// State access
		get value() {
			return state;
		},
		set value(newState: AuthState) {
			state = newState;
		},

		// Core methods
		updateState,
		loginWithOAuth,
		logout,

		// Helpers
		get isLoggedIn() {
			return !!state.accessToken && !!state.user;
		},

		get isReady() {
			return isInitialized && !state.loading;
		}
	};
};

export const authState = createAuthState();
