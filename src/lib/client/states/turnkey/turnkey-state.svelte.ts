import { PUBLIC_TURNKEY_ORG_ID } from '$env/static/public';
import { Turnkey, StorageKeys, AuthClient } from '@turnkey/sdk-browser';
import { getStorageItem } from '$lib/client/storage/local-storage';
import type { TKState } from './types';

const DEFAULT_TURNKEY_STATE: TKState = {};

const isJwt = (token: string) => {
	const [header, payload, signature] = token.split('.');
	return header && payload && signature;
};

const isJWTExpired = (token: string): boolean => {
	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		const currentTime = Math.floor(Date.now() / 1000);
		return payload.exp < currentTime;
	} catch (error) {
		console.error('[isJWTExpired] Error decoding JWT:', error);
		return true; // If we can't decode, assume expired
	}
};

const createTurnkeyState = () => {
	let state = $state(DEFAULT_TURNKEY_STATE);

	const updateState = (updates: Partial<TKState>) => {
		state = { ...state, ...updates };
	};

	const initTurnkey = async () => {
		if (typeof window === 'undefined') return;

		// Prevent multiple initialisations
		let hasInitialised = false;

		if (state.turnkey) {
			hasInitialised = true;
		}

		if (hasInitialised) return;

		const config = {
			apiBaseUrl: 'https://api.turnkey.com',
			defaultOrganizationId: PUBLIC_TURNKEY_ORG_ID
		};

		const sdk = new Turnkey(config);
		const indexedDb = await sdk.indexedDbClient();
		await indexedDb.init();

		// Try to restore previous session from localStorage
		const storedSession = getStorageItem<string>(StorageKeys.Session);
		const storedClient = getStorageItem<AuthClient>(StorageKeys.Client);

		let client;
		let sessionToken: string | undefined;

		if (storedSession && isJwt(storedSession) && !isJWTExpired(storedSession)) {
			try {
				if (storedClient === AuthClient.IndexedDb || !storedClient) {
					await indexedDb.loginWithSession(storedSession);
					client = indexedDb;
				}
				sessionToken = storedSession;
			} catch (err) {
				console.error('Failed to restore Turnkey session', err);
			}
		}

		updateState({ turnkey: sdk, indexedDb, client, session: sessionToken });
	};

	return {
		get value() {
			return state;
		},
		initTurnkey,
		updateState
	};
};

export const turnkeyState = createTurnkeyState();
