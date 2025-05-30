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

		// Does a sub-org already exist for this Google account?
		const existing = await client.getSubOrgIds({
			filterType: FilterType.OidcToken,
			filterValue: oidcToken
		});

		let subOrgId: string;

		if (existing?.organizationIds?.length) {
			// Re-use the first existing sub-org ID
			subOrgId = existing.organizationIds[0];
		} else {
			// Otherwise create a fresh sub-org linked to this Google account
			const createResp = await client.createSubOrganization({
				subOrganizationName: `suborg-${Date.now()}`,
				rootQuorumThreshold: 1,
				rootUsers: [
					{
						userName: 'Justin Ahinon',
						userEmail: 'justiny.ahinon@gmail.com',
						apiKeys: [],
						authenticators: [],
						oauthProviders: [
							{
								providerName: 'Google',
								oidcToken
							}
						]
					}
				],
			});

			if (!createResp?.subOrganizationId) {
				throw error(500, 'Failed to create sub-organization');
			}

			subOrgId = createResp.subOrganizationId;
		}

		// Issue / refresh the session bound to this browser key
		const { session } = await client.oauthLogin({
			organizationId: subOrgId,
			publicKey,
			oidcToken
		});

		if (!session) {
			throw error(400, 'Failed to login');
		}

		return json({ session });
	} catch (err) {
		console.error('Turnkey Google OAuth API error', err);
		return json({ error: 'internal' }, { status: 500 });
	}
}
