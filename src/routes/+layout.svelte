<script lang="ts">
	import '../app.css';
	import { setContext, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_TURNKEY_ORGANIZATION_ID } from '$env/static/public';
	import { Toaster } from '$lib/components/ui/sonner';

	// Types for Turnkey SDK (simplified)
	interface TurnkeyConfig {
		apiBaseUrl: string;
		defaultOrganizationId: string;
		rpId: string;
		iframeUrl?: string;
	}

	interface TurnkeyClient {
		getSession: () => Promise<any>;
		logout: () => Promise<void>;
	}

	interface IndexedDbClient {
		getPublicKey: () => Promise<string | null>;
		resetKeyPair: () => Promise<void>;
		loginWithSession: (session: any) => Promise<void>;
	}

	interface TurnkeyContext {
		turnkey: TurnkeyClient | undefined;
		indexedDbClient: IndexedDbClient | undefined;
		isReady: boolean;
	}

	// Runes for state management
	let turnkey = $state<TurnkeyClient | undefined>(undefined);
	let indexedDbClient = $state<IndexedDbClient | undefined>(undefined);
	let isReady = $state(false);

	// Turnkey configuration
	const turnkeyConfig: TurnkeyConfig = {
		apiBaseUrl: 'https://api.turnkey.com',
		defaultOrganizationId: PUBLIC_TURNKEY_ORGANIZATION_ID,
		rpId: 'localhost',
		iframeUrl: 'https://auth.turnkey.com'
	};

	// Initialize Turnkey SDK
	$effect(() => {
		if (browser) {
			initializeTurnkey();
		}
	});

	async function initializeTurnkey() {
		try {
			// This would be the actual Turnkey SDK initialization
			// For now, creating mock objects that match the interface
			const mockTurnkey: TurnkeyClient = {
				async getSession() {
					const session = localStorage.getItem('turnkey_session');
					return session ? JSON.parse(session) : null;
				},
				async logout() {
					localStorage.removeItem('turnkey_session');
					localStorage.removeItem('turnkey_public_key');
				}
			};

			const mockIndexedDbClient: IndexedDbClient = {
				async getPublicKey() {
					return localStorage.getItem('turnkey_public_key');
				},
				async resetKeyPair() {
					localStorage.removeItem('turnkey_public_key');
				},
				async loginWithSession(session: any) {
					localStorage.setItem('turnkey_session', JSON.stringify(session));
					localStorage.setItem('turnkey_public_key', session.publicKey || 'mock_public_key');
				}
			};

			turnkey = mockTurnkey;
			indexedDbClient = mockIndexedDbClient;
			isReady = true;
		} catch (error) {
			console.error('Failed to initialize Turnkey:', error);
		}
	}

	// Set context for child components
	const contextValue = $derived<TurnkeyContext>({
		turnkey,
		indexedDbClient,
		isReady
	});

	setContext('turnkey', contextValue);

	let { children } = $props();
</script>

{@render children()}
