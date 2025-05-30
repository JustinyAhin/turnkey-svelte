import { PUBLIC_TURNKEY_ORG_ID } from '$env/static/public';
import { Turnkey } from '@turnkey/sdk-browser';
import type { TKState } from './types';

const DEFAULT_TURNKEY_STATE: TKState = {};

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

		updateState({ turnkey: sdk, indexedDb });
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
