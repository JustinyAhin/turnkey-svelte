import { getContext } from 'svelte';

interface TurnkeyClient {
	getSession: () => Promise<any>;
	logout: () => Promise<void>;
}

interface IndexedDbClient {
	getPublicKey: () => Promise<string | null>;
	resetKeyPair: () => Promise<void>;
	loginWithSession: (session: unknown) => Promise<void>;
}

interface TurnkeyContext {
	turnkey: TurnkeyClient | undefined;
	indexedDbClient: IndexedDbClient | undefined;
	isReady: boolean;
}

export function useTurnkey(): TurnkeyContext {
	const context = getContext<TurnkeyContext>('turnkey');

	if (!context) {
		throw new Error('useTurnkey must be used within a TurnkeyProvider (layout)');
	}

	return context;
}

// Google OAuth helper functions
export interface GoogleOAuthParams {
	clientId: string;
	redirectUri: string;
	nonce: string;
}

export function createGoogleAuthUrl({ clientId, redirectUri, nonce }: GoogleOAuthParams): string {
	const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('response_type', 'id_token');
	url.searchParams.set('scope', 'openid email profile');
	url.searchParams.set('nonce', nonce);
	url.searchParams.set('prompt', 'select_account');
	url.searchParams.set('state', 'provider=google&flow=popup');

	return url.toString();
}

export function openGoogleAuthPopup(authUrl: string): Promise<{ idToken: string }> {
	const width = 500;
	const height = 600;
	const left = window.screenX + (window.innerWidth - width) / 2;
	const top = window.screenY + (window.innerHeight - height) / 2;

	return new Promise((resolve, reject) => {
		const authWindow = window.open(
			authUrl,
			'_blank',
			`width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
		);

		if (!authWindow) {
			reject(new Error('Failed to open Google login window.'));
			return;
		}

		const interval = setInterval(() => {
			try {
				const url = authWindow.location.href || '';
				if (url.startsWith(window.location.origin)) {
					const hashParams = new URLSearchParams(url.split('#')[1]);
					const idToken = hashParams.get('id_token');
					if (idToken) {
						authWindow.close();
						clearInterval(interval);
						resolve({ idToken });
					}
				}
			} catch (error) {
				console.error('[openGoogleAuthPopup] error', error);
				// Ignore cross-origin errors
			}

			if (authWindow.closed) {
				clearInterval(interval);
				reject(new Error('Authentication cancelled'));
			}
		}, 500);
	});
}

// Helper to generate nonce for OAuth
export function generateNonce(publicKey: string): string {
	// This would use proper crypto hashing in real implementation
	// For demo purposes, using a simple hash
	return btoa(publicKey).substring(0, 16);
}
