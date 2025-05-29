import { AuthClient, Turnkey, type TurnkeySDKBrowserConfig } from '@turnkey/sdk-browser';
import type { TurnkeyState } from './types';
import {
	PUBLIC_TURNKEY_ORGANIZATION_ID,
	PUBLIC_TURNKEY_PROXY_API_BASE_URL
} from '$env/static/public';
import { browser } from '$app/environment';
import { createSessionState } from './session-state.svelte';
import { isJWTExpired } from './utils';
import type { AuthState } from '../auth/types';
import { createConnectedTurnkeySigner } from '../auth/utils';

const DEFAULT_TURNKEY_STATE: TurnkeyState = {
	turnkey: null,
	authIframeClient: null,
	indexDbClient: null,
	client: null,
	isInitialized: false,
	isLoading: false,
	error: null,
	iframePublicKey: null,
	sessionJwt: null,
	authClient: null,
	signer: null
};

const TURNKEY_AUTH_IFRAME_CONTAINER_ID = 'turnkey-auth-iframe-container-id';
const TURNKEY_AUTH_IFRAME_ELEMENT_ID = 'turnkey-auth-iframe-element-id';

// Configuration
const TURNKEY_CONFIG: TurnkeySDKBrowserConfig = {
	apiBaseUrl: 'https://api.turnkey.com',
	defaultOrganizationId: PUBLIC_TURNKEY_ORGANIZATION_ID,
	rpId: 'localhost',
	serverSignUrl: `${PUBLIC_TURNKEY_PROXY_API_BASE_URL}/api/proxy/turnkey/sign`
};

const createTurnkeyState = () => {
	let state: TurnkeyState = $state({ ...DEFAULT_TURNKEY_STATE });
	let iframeInitialized = false;

	// Create session store
	const sessionState = createSessionState();

	const updateState = (updates: Partial<TurnkeyState>) => {
		state = { ...state, ...updates };
	};

	const initializeTurnkey = async () => {
		if (!browser || iframeInitialized) {
			console.log('[turnkeyState] Skipping initialization - not in browser or already initialized');
			return;
		}

		updateState({ isLoading: true, error: null });

		try {
			const turnkeyInstance = new Turnkey(TURNKEY_CONFIG);
			updateState({ turnkey: turnkeyInstance });

			// Initialize all clients
			await initializeIframeClient(turnkeyInstance);
			await initializeIndexDbClient(turnkeyInstance);

			iframeInitialized = true;
			updateState({ isInitialized: true, isLoading: false });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Turnkey';
			console.error('[turnkeyState] ❌ Initialization error:', error);
			updateState({
				error: errorMessage,
				isLoading: false,
				isInitialized: false
			});
		}
	};

	const initializeIndexDbClient = async (turnkeyInstance: Turnkey) => {
		if (!browser) return;

		const indexDbClient = await turnkeyInstance.indexedDbClient();
		await indexDbClient?.init();
		updateState({ indexDbClient });
	};

	const initializeIframeClient = async (turnkeyInstance: Turnkey) => {
		if (!browser) return;

		await new Promise((resolve) => {
			if (document.readyState === 'complete') {
				resolve(true);
			} else {
				window.addEventListener('load', resolve);
			}
		});

		let iframeContainer = document.getElementById(TURNKEY_AUTH_IFRAME_CONTAINER_ID);
		if (!iframeContainer) {
			iframeContainer = document.createElement('div');
			iframeContainer.id = TURNKEY_AUTH_IFRAME_CONTAINER_ID;
			iframeContainer.style.display = 'none';
			document.body.appendChild(iframeContainer);
		}

		try {
			const authIframeClient = await turnkeyInstance.iframeClient({
				iframeContainer,
				iframeUrl: 'https://auth.turnkey.com',
				iframeElementId: TURNKEY_AUTH_IFRAME_ELEMENT_ID
			});

			updateState({
				authIframeClient,
				iframePublicKey: authIframeClient.iframePublicKey || null
			});

			console.log('[turnkeyState] Iframe client initialized');
		} catch (error) {
			console.error('[turnkeyState] Failed to initialize iframe client:', error);
			throw error;
		}
	};

	const updateActiveClient = async () => {
		const { sessionJwt, authClient } = sessionState;
		const currentState = state;

		if (!currentState.turnkey || !authClient) {
			console.log('[updateActiveClient] No turnkey instance or auth client');
			updateState({ client: null });
			return;
		}

		try {
			switch (authClient) {
				case AuthClient.Iframe:
					console.log('[updateActiveClient] Iframe client');

					if (sessionJwt && currentState.authIframeClient) {
						try {
							if (typeof sessionJwt === 'string' && sessionJwt.includes('.')) {
								if (isJWTExpired(sessionJwt)) {
									console.log('[updateActiveClient] Iframe session expired');
									updateState({ client: null, sessionJwt, authClient });
									break;
								}
							}

							await currentState.authIframeClient.injectCredentialBundle(sessionJwt);
							updateState({ client: currentState.authIframeClient, sessionJwt, authClient });
							console.log('[updateActiveClient] Iframe client activated');
						} catch (error) {
							console.error('[updateActiveClient] Failed to inject credential bundle:', error);
							updateState({ client: null, sessionJwt, authClient });
						}
					} else {
						updateState({ client: null, sessionJwt, authClient });
					}
					break;

				case AuthClient.IndexedDb:
					console.log('[updateActiveClient] IndexedDB client');

					if (sessionJwt && currentState.indexDbClient) {
						if (typeof sessionJwt === 'string' && sessionJwt.includes('.')) {
							if (isJWTExpired(sessionJwt)) {
								console.log('[updateActiveClient] IndexedDB session expired');
								updateState({ client: null, sessionJwt, authClient });
								break;
							}
						}

						updateState({ client: currentState.indexDbClient, sessionJwt, authClient });
					} else {
						console.log('[updateActiveClient] No valid session or IndexedDB client');
						updateState({ client: null, sessionJwt, authClient });
					}

					break;

				default:
					console.log('[updateActiveClient] Default case');
					updateState({ client: null });
					break;
			}

			updateState({
				sessionJwt: sessionJwt,
				authClient: authClient
			});
		} catch (error) {
			console.error('[turnkeyState] Error updating active client:', error);
			updateState({ client: null });
		}
	};

	const cleanup = () => {
		const container = document.getElementById(TURNKEY_AUTH_IFRAME_CONTAINER_ID);
		if (container) {
			container.remove();
		}
	};

	const reset = () => {
		cleanup();
		state = { ...DEFAULT_TURNKEY_STATE };
		iframeInitialized = false;
	};

	const setTurnkeySigner = (authState: AuthState) => {
		const walletAdress = authState.selectedWallet?.address;
		const networkKey = 'sepolia';
		const turnkeyClient = turnkeyState.value.client;
		const turnkeySubOrgId = authState.user?.turnkeySubOrgId;

		if (!turnkeyClient || !turnkeySubOrgId || !walletAdress) {
			console.error('Missing required data for signer');
			return;
		}

		const signer = createConnectedTurnkeySigner({
			walletAddress: walletAdress,
			networkKey,
			turnkeyClient,
			turnkeySubOrgId
		});

		turnkeyState.updateState({ signer });
	};

	// Auto-initialize and watch for session changes
	$effect.root(() => {
		$effect(() => {
			if (browser && !state.isInitialized && !state.isLoading) {
				initializeTurnkey();
			}

			return () => {
				cleanup();
			};
		});

		// Watch for session changes and update active client
		$effect(() => {
			if (state.isInitialized) {
				console.log('[turnkeyState] Updating active client');
				updateActiveClient();
			}

			return () => {
				console.log('[turnkeyState] Cleanup');
			};
		});
	});

	return {
		get value() {
			return state;
		},
		set value(newState: TurnkeyState) {
			state = newState;
		},

		updateState,
		initializeTurnkey,
		updateActiveClient,
		reset,
		setTurnkeySigner,

		get isReady() {
			return (
				state.isInitialized &&
				!state.isLoading &&
				(!!state.authIframeClient || !!state.indexDbClient)
			);
		},

		// Session access
		get session() {
			return sessionState.sessionJwt;
		},
		get authClient() {
			return sessionState.authClient;
		}
	};
};

export const turnkeyState = createTurnkeyState();
