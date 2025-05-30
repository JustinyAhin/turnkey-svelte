import type { Turnkey, TurnkeyIndexedDbClient, TurnkeyBrowserClient } from '@turnkey/sdk-browser';

type TKState = {
	turnkey?: Turnkey;
	indexedDb?: TurnkeyIndexedDbClient;
	client?: TurnkeyBrowserClient;
	session?: string;
};

export type { TKState };
