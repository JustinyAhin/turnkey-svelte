import type { TurnkeySigner } from '@turnkey/ethers';
import type {
	AuthClient,
	Turnkey,
	TurnkeyBrowserClient,
	TurnkeyIframeClient,
	TurnkeyIndexedDbClient
} from '@turnkey/sdk-browser';

type TurnkeyState = {
	turnkey: Turnkey | null;
	authIframeClient: TurnkeyIframeClient | null;
	indexDbClient: TurnkeyIndexedDbClient | null;
	client: TurnkeyBrowserClient | TurnkeyIframeClient | null; // Active client
	isInitialized: boolean;
	isLoading: boolean;
	error: string | null;
	iframePublicKey: string | null;
	sessionJwt: string | null;
	authClient: AuthClient | null;
	signer: TurnkeySigner | null;
};

export type { TurnkeyState };
