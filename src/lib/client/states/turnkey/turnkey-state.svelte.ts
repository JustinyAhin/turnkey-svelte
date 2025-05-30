import { getContext, setContext } from 'svelte';
import {
	Turnkey,
	TurnkeyIframeClient,
	TurnkeyIndexedDbClient,
	TurnkeyPasskeyClient,
	TurnkeyBrowserClient,
	TurnkeyWalletClient,
	AuthClient,
	type TurnkeySDKBrowserConfig
} from '@turnkey/sdk-browser';
import type { WalletInterface } from '@turnkey/wallet-stamper';

export interface TurnkeyClientType {
	client: TurnkeyBrowserClient | undefined;
	turnkey: Turnkey | undefined;
	authIframeClient: TurnkeyIframeClient | undefined;
	passkeyClient: TurnkeyPasskeyClient | undefined;
	walletClient: TurnkeyWalletClient | undefined;
	indexedDbClient: TurnkeyIndexedDbClient | undefined;
}

export type TurnkeyProviderConfig = TurnkeySDKBrowserConfig & {
	wallet?: WalletInterface;
};

export interface SessionType {
	expiry?: number;
	token?: string;
	authClient?: AuthClient;
}

const TURNKEY_CONTEXT_KEY = Symbol('turnkey');

export function createTurnkeyState(config: TurnkeyProviderConfig, session: SessionType = {}) {
	let turnkey = $state<Turnkey | undefined>(undefined);
	let indexedDbClient = $state<TurnkeyIndexedDbClient | undefined>(undefined);
	let passkeyClient = $state<TurnkeyPasskeyClient | undefined>(undefined);
	let walletClient = $state<TurnkeyWalletClient | undefined>(undefined);
	let authIframeClient = $state<TurnkeyIframeClient | undefined>(undefined);
	let client = $state<TurnkeyBrowserClient | undefined>(undefined);

	let iframeInitialized = $state(false);
	let sessionState = $state<SessionType>(session);

	const TurnkeyAuthIframeContainerId = 'turnkey-auth-iframe-container-id';
	const TurnkeyAuthIframeElementId = 'turnkey-auth-iframe-element-id';

	// Initialize Turnkey clients
	async function initializeTurnkey() {
		if (iframeInitialized) return;

		iframeInitialized = true;

		try {
			// Create an instance of TurnkeyBrowserSDK
			const turnkeyBrowserSDK = new Turnkey(config);
			turnkey = turnkeyBrowserSDK;

			// Create an instance of TurnkeyPasskeyClient
			passkeyClient = turnkeyBrowserSDK.passkeyClient();

			if (config.wallet) {
				walletClient = turnkeyBrowserSDK.walletClient(config.wallet);
			}

			// Create an instance of TurnkeyIframeClient
			try {
				const iframeClient = await turnkeyBrowserSDK.iframeClient({
					iframeContainer: document.getElementById(TurnkeyAuthIframeContainerId),
					iframeUrl: config.iframeUrl || 'https://auth.turnkey.com',
					...(config.dangerouslyOverrideIframeKeyTtl && {
						dangerouslyOverrideIframeKeyTtl: config.dangerouslyOverrideIframeKeyTtl
					}),
					iframeElementId: TurnkeyAuthIframeElementId
				});
				authIframeClient = iframeClient;
			} catch (error) {
				console.error('Failed to initialize iframe client:', error);
			}

			// Create an instance of TurnkeyIndexedDbClient
			try {
				const indexedDbClientInstance = await turnkeyBrowserSDK.indexedDbClient();
				await indexedDbClientInstance?.init();
				indexedDbClient = indexedDbClientInstance;
			} catch (error) {
				console.error('Failed to initialize IndexedDB client:', error);
			}
		} catch (error) {
			console.error('Failed to initialize Turnkey SDK:', error);
			// Reset initialization flag to allow retry
			iframeInitialized = false;
		}
	}

	// Effect to initialize Turnkey when component mounts - only run once
	$effect(() => {
		if (!iframeInitialized) {
			// Use setTimeout to break out of reactive context for async operation
			setTimeout(() => {
				initializeTurnkey();
			}, 0);
		}
	});

	// Effect to update active client based on session - track specific dependencies
	$effect(() => {
		const authClientType = sessionState?.authClient;
		const sessionToken = sessionState?.token;
		const sessionExpiry = sessionState?.expiry;

		// Only proceed if we have clients initialized
		if (
			!authClientType ||
			!authIframeClient ||
			!passkeyClient ||
			!walletClient ||
			!indexedDbClient
		) {
			return;
		}

		switch (authClientType) {
			case AuthClient.Iframe: {
				const expiry = sessionExpiry || 0;
				if (expiry > Date.now() && sessionToken && authIframeClient) {
					// Use setTimeout to prevent effect loops
					setTimeout(() => {
						authIframeClient
							?.injectCredentialBundle(sessionToken)
							.then(() => {
								client = authIframeClient;
							})
							.catch((error) => {
								console.error('Failed to inject credential bundle:', error);
							});
					}, 0);
				}
				break;
			}
			case AuthClient.Passkey:
				client = passkeyClient;
				break;
			case AuthClient.Wallet:
				client = walletClient;
				break;
			case AuthClient.IndexedDb: {
				const indexedDbExpiry = sessionExpiry || 0;
				if (indexedDbExpiry > Date.now() && sessionToken) {
					client = indexedDbClient;
				}
				break;
			}
			default:
				// Handle unknown auth client type if needed
				break;
		}
	});

	// Update session
	function updateSession(newSession: SessionType) {
		// Only update if there are actual changes to prevent loops
		const hasChanges =
			newSession.expiry !== sessionState.expiry ||
			newSession.token !== sessionState.token ||
			newSession.authClient !== sessionState.authClient;

		if (hasChanges) {
			sessionState = { ...sessionState, ...newSession };
		}
	}

	// Getters for reactive access
	const state = {
		get client() {
			return client;
		},
		get turnkey() {
			return turnkey;
		},
		get passkeyClient() {
			return passkeyClient;
		},
		get authIframeClient() {
			return authIframeClient;
		},
		get indexedDbClient() {
			return indexedDbClient;
		},
		get walletClient() {
			return walletClient;
		},
		get session() {
			return sessionState;
		},
		updateSession,
		initializeTurnkey,
		TurnkeyAuthIframeContainerId,
		TurnkeyAuthIframeElementId
	};

	return state;
}

export type TurnkeyState = ReturnType<typeof createTurnkeyState>;

// Context helpers
export function setTurnkeyContext(state: TurnkeyState) {
	setContext(TURNKEY_CONTEXT_KEY, state);
}

export function getTurnkeyContext(): TurnkeyState {
	const context = getContext<TurnkeyState>(TURNKEY_CONTEXT_KEY);
	if (!context) {
		throw new Error('TurnkeyContext must be used within a TurnkeyProvider');
	}
	return context;
}
