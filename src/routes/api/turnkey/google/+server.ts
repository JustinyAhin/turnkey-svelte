import { TURNKEY_PRIVATE_KEY, TURNKEY_PUBLIC_KEY } from '$env/static/private';
import { PUBLIC_TURNKEY_ORG_ID } from '$env/static/public';
import { error, json } from '@sveltejs/kit';
import { Turnkey } from '@turnkey/sdk-server';
import { z } from 'zod/v4-mini';

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
	defaultOrganizationId: PUBLIC_TURNKEY_ORG_ID
});

const client = turnkey.apiClient();

const requestSchema = z.object({
	oidcToken: z.string(),
	publicKey: z.string()
});

export async function POST({ request }) {
	try {
		const body = await request.json();

		const safeParsed = requestSchema.safeParse(body);

		if (!safeParsed.success) {
			console.error('Invalid request', safeParsed.error);
			return json({ error: 'Invalid request' }, { status: 400 });
		}

		const { oidcToken, publicKey } = safeParsed.data;

		if (!oidcToken || !publicKey) {
			console.error('Missing parameters', { oidcToken, publicKey });
			return json({ error: 'Missing parameters' }, { status: 400 });
		}

		const subOrgsIds = await client.getSubOrgIds({
			filterType: FilterType.OidcToken,
			filterValue: oidcToken
		});

		if (subOrgsIds?.organizationIds?.length > 0) {
			console.error('Social login is already connected to another account', subOrgsIds);
			throw error(400, 'Social login is already connected to another account');
		}

		// 2️⃣ Exchange the Google OIDC token for a Turnkey user session bound to the supplied pubkey
		const loginResp = await client.oauthLogin({
			oidcToken,
			publicKey
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
