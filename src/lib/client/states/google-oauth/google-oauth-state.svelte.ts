import { sha256 } from '@noble/hashes/sha2';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/auth';
const popupWidth = 500;
const popupHeight = 600;

export interface OidcTokenParams {
	publicKey: string;
	clientId: string;
	redirectURI: string;
}

export interface GoogleOAuthResult {
	idToken: string;
}

/**
 * Converts bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Google OAuth token retrieval function
 * Opens a popup window for Google OAuth and returns the ID token
 */
export const googleOidcToken = async ({
	publicKey,
	clientId,
	redirectURI
}: OidcTokenParams): Promise<GoogleOAuthResult> => {
	// Create nonce from public key hash
	const nonce = bytesToHex(sha256(publicKey));

	// Build Google Auth URL
	const googleAuthUrl = new URL(GOOGLE_AUTH_URL);
	googleAuthUrl.searchParams.set('client_id', clientId);
	googleAuthUrl.searchParams.set('redirect_uri', redirectURI);
	googleAuthUrl.searchParams.set('response_type', 'id_token');
	googleAuthUrl.searchParams.set('scope', 'openid email profile');
	googleAuthUrl.searchParams.set('nonce', nonce);
	googleAuthUrl.searchParams.set('prompt', 'select_account');

	// Calculate popup position
	const width = popupWidth;
	const height = popupHeight;
	const left = window.screenX + (window.innerWidth - width) / 2;
	const top = window.screenY + (window.innerHeight - height) / 2;

	return new Promise((resolve, reject) => {
		// Open popup window
		const authWindow = window.open(
			googleAuthUrl.toString(),
			'_blank',
			`width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
		);

		if (!authWindow) {
			reject(new Error('Failed to open Google login window.'));
			return;
		}

		// Poll for redirect
		const interval = setInterval(() => {
			try {
				const url = authWindow?.location.href || '';
				if (url.startsWith(window.location.origin)) {
					const hashParams = new URLSearchParams(url.split('#')[1]);
					const idToken = hashParams.get('id_token');
					if (idToken) {
						authWindow?.close();
						clearInterval(interval);
						resolve({ idToken });
					}
				}
			} catch (error) {
				console.error('Error getting Google OAuth token', error);
				// Ignore cross-origin errors until the popup redirects to the same origin.
				// These errors occur because the script attempts to access the URL of the popup window while it's on a different domain.
				// Due to browser security policies (Same-Origin Policy), accessing properties like location.href on a window that is on a different domain will throw an exception.
				// Once the popup redirects to the same origin as the parent window, these errors will no longer occur, and the script can safely access the popup's location to extract parameters.
			}

			if (authWindow?.closed) {
				clearInterval(interval);
				reject(new Error('Google login window was closed by user.'));
			}
		}, 500);

		// Cleanup on timeout (optional)
		setTimeout(() => {
			if (!authWindow?.closed) {
				authWindow?.close();
				clearInterval(interval);
				reject(new Error('Google login timeout.'));
			}
		}, 300000); // 5 minute timeout
	});
};

/**
 * Create Google Auth state management
 */
export function createGoogleAuthState() {
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let isAuthenticated = $state(false);
	let userInfo = $state<unknown>(null);

	async function signInWithGoogle(config: OidcTokenParams): Promise<GoogleOAuthResult | null> {
		try {
			isLoading = true;
			error = null;

			const result = await googleOidcToken(config);
			isAuthenticated = true;

			return result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
			isAuthenticated = false;
			return null;
		} finally {
			isLoading = false;
		}
	}

	function reset() {
		isLoading = false;
		error = null;
		isAuthenticated = false;
		userInfo = null;
	}

	return {
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get isAuthenticated() {
			return isAuthenticated;
		},
		get userInfo() {
			return userInfo;
		},
		signInWithGoogle,
		reset,
		setUserInfo: (info: unknown) => {
			userInfo = info;
		},
		clearError: () => {
			error = null;
		}
	};
}
