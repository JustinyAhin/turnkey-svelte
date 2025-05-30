import { TURNKEY_ORG_ID, TURNKEY_PRIVATE_KEY, TURNKEY_PUBLIC_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { Turnkey } from '@turnkey/sdk-server';

const turnkey = new Turnkey({
	apiBaseUrl: 'https://api.turnkey.com',
	apiPrivateKey: TURNKEY_PRIVATE_KEY,
	apiPublicKey: TURNKEY_PUBLIC_KEY,
	defaultOrganizationId: TURNKEY_ORG_ID
});

const client = turnkey.apiClient();

export const POST = async ({ request }) => {
	const { oidcToken } = (await request.json()) as {
		oidcToken: string | null;
	};

	if (!oidcToken) {
		return new Response('Missing oidcToken', { status: 400 });
	}

	const suborgs = await client.getSubOrgIds({
		filterType: 'OIDC_TOKEN',
		filterValue: oidcToken
	});

	if (suborgs!.organizationIds.length > 0) {
		return new Response('Social login is already connected to another account', {
			status: 400
		});
	}

	return json({
		suborgsIds: suborgs.organizationIds
	});
};
