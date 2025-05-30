import { TURNKEY_ORG_ID, TURNKEY_PRIVATE_KEY, TURNKEY_PUBLIC_KEY } from '$env/static/private';
import { json, error } from '@sveltejs/kit';
import { Turnkey } from '@turnkey/sdk-server';

const turnkey = new Turnkey({
	apiBaseUrl: 'https://api.turnkey.com',
	apiPrivateKey: TURNKEY_PRIVATE_KEY,
	apiPublicKey: TURNKEY_PUBLIC_KEY,
	defaultOrganizationId: TURNKEY_ORG_ID
});

const client = turnkey.apiClient();

export const POST = async ({ request }) => {
	try {
		const { oidcToken } = (await request.json()) as {
			oidcToken: string | null;
		};

		if (!oidcToken) {
			throw error(400, 'Missing oidcToken');
		}

		const suborgs = await client.getSubOrgIds({
			filterType: 'OIDC_TOKEN',
			filterValue: oidcToken
		});

		if (suborgs?.organizationIds?.length > 0) {
			throw error(400, 'Social login is already connected to another account');
		}

		return json({
			organizationIds: suborgs?.organizationIds || []
		});
	} catch (err) {
		console.error('Error in turnkey-oauth API:', err);

		if (err instanceof Error && 'status' in err) {
			// This is already a SvelteKit error, re-throw it
			throw err;
		}

		// This is an unexpected error
		throw error(500, 'Internal server error');
	}
};
