import { PUBLIC_TURNKEY_ORGANIZATION_ID } from '$env/static/public';
import { tk } from '$lib/stores/turnkey';
import { Turnkey } from '@turnkey/sdk-browser';

/**
 * Initialise the Turnkey browser SDK once on the client.
 * Safe-no-op when executed during SSR.
 */
export async function initTurnkey() {
	if (typeof window === 'undefined') return; // SSR guard

	// Prevent multiple initialisations
	let hasInitialised = false;
	tk.update((s) => {
		if (s.turnkey) {
			hasInitialised = true;
		}
		return s;
	});
	if (hasInitialised) return;

	const config = {
		apiBaseUrl: 'https://api.turnkey.com',
		defaultOrganizationId: PUBLIC_TURNKEY_ORGANIZATION_ID
	};

	const sdk = new Turnkey(config);
	const indexedDb = await sdk.indexedDbClient();
	await indexedDb.init();

	tk.set({ turnkey: sdk, indexedDb });
}
