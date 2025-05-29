import { type TurnkeySDKApiTypes } from '@turnkey/sdk-browser';

type NetworkKey =
	| 'ethereum'
	| 'sepolia'
	| 'goerli'
	| 'arbitrum'
	| 'arbitrum-goerli'
	| 'arbitrum-sepolia'
	| 'optimism'
	| 'optimism-goerli'
	| 'optimism-sepolia'
	| 'polygon'
	| 'polygon-mumbai'
	| 'base'
	| 'base-goerli'
	| 'base-sepolia';

type TurnkeyWallet = TurnkeySDKApiTypes.TGetWalletResponse['wallet'] & {
	accounts: TurnkeySDKApiTypes.TGetWalletAccountResponse['account'][];
};

type SNSLoginResult = {
	oauthResponse: {
		userId: string;
		apiKeyId: string;
		credentialBundle: string;
		activity: TurnkeySDKApiTypes.TGetActivitiesResponse['activities'][0];
	};
	user: User;
	wallets: TurnkeyWallet[];
	accessToken: string;
};

type Organization = {
	organizationId: string;
	organizationName?: string;
};

type User = {
	id: string;
	email: string;
	name: string;
	payload: string;
	turnkeyUserId: string;
	turnkeySubOrgId: string;
	createdAt: string;
	lastLoginAt: string;
};

type Account = {
	address: string;
	addressFormat?: string;
	path?: string;
	pathFormat?: string;
	publicKey?: string;
};

type SelectedWallet = {
	walletId: string;
	address: string;
	displayName: string;
};

type GetSelectedWalletParams = {
	auth: AuthState;
	wallets: TurnkeyWallet[];
	networkKey?: NetworkKey;
};

type AuthState = {
	loading: boolean;
	walletsLoading: boolean;
	walletsError: string;
	error: string;
	user: User | null;
	sessionExpiring: boolean;
	wallets: TurnkeyWallet[];
	selectedWallet: SelectedWallet | null;
	accessToken: string | null;
	isAuthenticatingZipperBackend: boolean;
};

export type {
	AuthState,
	User,
	Organization,
	Account,
	TurnkeyWallet,
	SNSLoginResult,
	GetSelectedWalletParams,
	NetworkKey
};
