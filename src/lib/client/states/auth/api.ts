import { PUBLIC_TURNKEY_PROXY_API_BASE_URL } from '$env/static/public';
import type { SNSLoginResult } from './types';

const snsLogin = async ({
	providerName,
	credential,
	iframePublicKey
}: {
	providerName: string;
	credential: string;
	iframePublicKey: string;
}) => {
	try {
		const response = await fetch(`${PUBLIC_TURNKEY_PROXY_API_BASE_URL}/api/auth/snsLogin`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				providerName,
				credential,
				targetPublicKey: iframePublicKey
			})
		});

		if (!response.ok) {
			console.error('[snsLogin] SNS login failed', await response.json());
			return null;
		}

		return (await response.json()) as SNSLoginResult;
	} catch (error) {
		console.error('[snsLogin] SNS login failed', error);
		return null;
	}
};

export { snsLogin };
