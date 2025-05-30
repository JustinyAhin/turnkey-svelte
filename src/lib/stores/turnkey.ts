import { writable, type Writable } from 'svelte/store';
import type {
  Turnkey,
  TurnkeyIndexedDbClient,
  TurnkeyBrowserClient
} from '@turnkey/sdk-browser';

export interface TKState {
  turnkey?: Turnkey;
  indexedDb?: TurnkeyIndexedDbClient;
  client?: TurnkeyBrowserClient;
  session?: string;
}

export const tk: Writable<TKState> = writable({}); 