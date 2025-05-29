import { authStorage, WALLETS_KEY, USER_KEY, TOKEN_KEY } from '$lib/client/storage/auth';
import type { AuthState, GetSelectedWalletParams, NetworkKey, TurnkeyWallet, User } from './types';
import { TurnkeySigner } from '@turnkey/ethers';
import { ethers } from 'ethers';
import type { TurnkeyState } from '../turnkey/types';
import { PUBLIC_INFURA_API_KEY } from '$env/static/public';

const addUserDataToStorage = async ({
	token,
	user,
	wallets
}: {
	token: string;
	user: User;
	wallets: TurnkeyWallet[];
}) => {
	await authStorage.set(USER_KEY, user);
	await authStorage.set(WALLETS_KEY, wallets);
	await authStorage.set(TOKEN_KEY, token);
};

type CreateConnectedTurnkeySignerParams = {
	walletAddress: string;
	networkKey: NetworkKey;
	turnkeyClient: NonNullable<TurnkeyState['client']>;
	turnkeySubOrgId: string;
};

const sepolia = {
	name: 'Sepolia',
	rpcUrl: `https://sepolia.infura.io/v3/${PUBLIC_INFURA_API_KEY}`,
	chainId: 11155111
};

const createConnectedTurnkeySigner = ({
	walletAddress,
	turnkeyClient,
	turnkeySubOrgId
}: CreateConnectedTurnkeySignerParams) => {
	try {
		// Create the TurnkeySigner
		const turnkeySigner = new TurnkeySigner({
			client: turnkeyClient,
			organizationId: turnkeySubOrgId,
			signWith: walletAddress
		});

		// Create a provider using the network's RPC URL
		const provider = new ethers.JsonRpcProvider(sepolia.rpcUrl);

		// Connect the signer to the provider
		const connectedSigner = turnkeySigner.connect(provider);

		console.log('[createConnectedTurnkeySigner] Signer created successfully');
		return connectedSigner;
	} catch (error) {
		console.error('[createConnectedTurnkeySigner] Failed to create signer:', error);
		return null;
	}
};

const getSelectedWallet = ({ wallets }: GetSelectedWalletParams): AuthState['selectedWallet'] => {
	if (!wallets || wallets.length === 0) {
		console.log('[getSelectedWallet] No wallets available');
		return null;
	}

	return {
		walletId: wallets[0].walletId,
		address: wallets[0].accounts[0].address,
		displayName:
			wallets[0].accounts[0].address.slice(0, 6) + '...' + wallets[0].accounts[0].address.slice(-4)
	};
};

export { addUserDataToStorage, getSelectedWallet, createConnectedTurnkeySigner };
