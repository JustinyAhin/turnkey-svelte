import { AuthClient, StorageKeys } from '@turnkey/sdk-browser';
import { getStorageItem, watchStorageItem } from '$lib/client/storage/local-storage';
import { browser } from '$app/environment';

const createSessionState = () => {
	let sessionJwt = $state<string | null>(getStorageItem<string>(StorageKeys.Session));
	let authClient = $state<AuthClient | null>(getStorageItem<AuthClient>(StorageKeys.Client));

	// Watch for storage changes
	let cleanupSession: (() => void) | null = null;
	let cleanupAuthClient: (() => void) | null = null;

	$effect.root(() => {
		$effect(() => {
			if (browser) {
				cleanupSession = watchStorageItem<string>(StorageKeys.Session, (value) => {
					sessionJwt = value;
				});

				cleanupAuthClient = watchStorageItem<AuthClient>(StorageKeys.Client, (value) => {
					authClient = value;
				});

				return () => {
					cleanupSession?.();
					cleanupAuthClient?.();
				};
			}
		});
	});

	return {
		get sessionJwt() {
			return sessionJwt;
		},
		get authClient() {
			return authClient;
		}
	};
};

export { createSessionState };
