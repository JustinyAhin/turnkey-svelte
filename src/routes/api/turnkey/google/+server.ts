import { TURNKEY_PRIVATE_KEY, TURNKEY_PUBLIC_KEY, TURNKEY_ORG_ID } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import { Turnkey } from '@turnkey/sdk-server';

enum FilterType {
	Email = 'EMAIL',
	PhoneNumber = 'PHONE_NUMBER',
	OidcToken = 'OIDC_TOKEN',
	PublicKey = 'PUBLIC_KEY'
}

const turnkey = new Turnkey({
	apiBaseUrl: 'https://api.turnkey.com',
	apiPrivateKey: TURNKEY_PRIVATE_KEY,
	apiPublicKey: TURNKEY_PUBLIC_KEY,
	defaultOrganizationId: TURNKEY_ORG_ID
});

const client = turnkey.apiClient();

export async function POST({ request }) {
	try {
		const { id_token: idToken, pubkey } = (await request.json()) as {
			id_token: string | null;
			pubkey: string | null;
		};

		if (!idToken || !pubkey) {
			return json({ error: 'Missing parameters' }, { status: 400 });
		}

		const subOrgsIds = await client.getSubOrgIds({
			filterType: FilterType.OidcToken,
			filterValue: idToken
		});

		if (subOrgsIds?.organizationIds?.length > 0) {
			console.error('Social login is already connected to another account', subOrgsIds);
			throw error(400, 'Social login is already connected to another account');
		}

		// 2️⃣ Exchange the Google OIDC token for a Turnkey user session bound to the supplied pubkey
		const loginResp = await client.oauthLogin({
			oidcToken: idToken,
			publicKey: pubkey
		});

		if (!loginResp?.session) {
			console.error('Failed to login', loginResp);
			throw error(400, 'Failed to login');
		}

		return json({ session: loginResp.session });
	} catch (err) {
		console.error('Turnkey Google OAuth API error', err);
		return json({ error: 'internal' }, { status: 500 });
	}
}
