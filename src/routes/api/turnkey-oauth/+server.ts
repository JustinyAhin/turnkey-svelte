import { json } from '@sveltejs/kit';
import { server } from '@turnkey/sdk-server';

enum FilterType {
	Email = 'EMAIL',
	PhoneNumber = 'PHONE_NUMBER',
	OidcToken = 'OIDC_TOKEN',
	PublicKey = 'PUBLIC_KEY'
}

export const POST = async ({ request }) => {
	const { credential, token, publicKey } = (await request.json()) as {
		credential: string | null;
		token: string | null;
		publicKey: string | null;
	};

	if (!credential || !token || !publicKey) {
		console.error('Missing required fields');
		return new Response('Missing required fields', { status: 400 });
	}

	console.log({ credential, token, publicKey });

	const createSuborgData: Record<string, unknown> = {
		oauthProviders: [{ providerName: 'Google Auth - Embedded Wallet', oidcToken: token }]
	};

	const resp = await server.getOrCreateSuborg({
		filterType: FilterType.OidcToken,
		filterValue: credential,
		additionalData: createSuborgData
	});

	const suborgIds = resp?.subOrganizationIds;
	if (!suborgIds || suborgIds.length === 0) {
		console.error('No suborg ids found');
		return new Response('No suborg ids found', { status: 400 });
	}

	const suborgId = suborgIds[0];
	const sessionResponse = await server.oauthLogin({
		suborgID: suborgId!,
		oidcToken: credential,
		publicKey: publicKey,
		sessionLengthSeconds: 60 * 60 * 24 * 7
	});

	if (!sessionResponse || !sessionResponse.session) {
		console.error('No session response');
		return new Response('No session response', { status: 400 });
	}

	return json({
		session: sessionResponse.session
	});
};
