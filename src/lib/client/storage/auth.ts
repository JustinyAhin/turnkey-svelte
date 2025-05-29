import { storageManager } from './indexed-db';

const authStorage = storageManager({
	base: 'auth'
});

const WALLETS_KEY = 'wallets';
const USER_KEY = 'user';
const TOKEN_KEY = 'access_token';

export { authStorage, WALLETS_KEY, USER_KEY, TOKEN_KEY };
