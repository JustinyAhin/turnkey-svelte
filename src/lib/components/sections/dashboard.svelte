<script lang="ts">
	import { useTurnkey } from '$lib/turnkey';
	import { goto } from '$app/navigation';

	const { turnkey, indexedDbClient, isReady } = useTurnkey();

	let loading = $state(true);
	let user = $state<any>(null);
	let session = $state<any>(null);
	let publicKey = $state<string | null>(null);

	// Load user data when component mounts
	$effect(() => {
		if (isReady && turnkey && indexedDbClient) {
			loadUserData();
		}
	});

	async function loadUserData() {
		try {
			const currentSession = await turnkey!.getSession();
			if (!currentSession) {
				await handleLogout();
				return;
			}

			session = currentSession;
			publicKey = await indexedDbClient!.getPublicKey();

			// Mock user data - in real implementation, this would come from Turnkey API
			user = {
				email: 'user@example.com',
				organizationId: currentSession.organizationId,
				userId: currentSession.userId,
				authenticatedWith: 'Google',
				wallets: [
					{
						id: 'wallet_1',
						name: 'Default Wallet',
						accounts: [
							{
								address: '0x1234567890abcdef1234567890abcdef12345678',
								type: 'ETH',
								balance: '0.5 ETH'
							},
							{
								address: 'Hn7cABqLq46Es1jh92dQQisAX662SmxELLLsHHe4YWrH',
								type: 'SOL',
								balance: '2.1 SOL'
							}
						]
					}
				]
			};
		} catch (error) {
			console.error('Failed to load user data:', error);
			await handleLogout();
		} finally {
			loading = false;
		}
	}

	async function handleLogout() {
		try {
			await turnkey?.logout();
			await indexedDbClient?.resetKeyPair();
			goto('/');
		} catch (error) {
			console.error('Logout failed:', error);
			// Force navigation even if logout fails
			goto('/');
		}
	}

	function formatAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function getExplorerUrl(address: string, type: string): string {
		if (type === 'ETH') {
			return `https://etherscan.io/address/${address}`;
		} else if (type === 'SOL') {
			return `https://solscan.io/account/${address}`;
		}
		return '#';
	}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
		></div>
	</div>
{:else if user}
	<div class="min-h-screen bg-gray-50 py-8">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<!-- User Info Card -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
					<h2 class="mb-6 text-2xl font-bold text-gray-900">Account Information</h2>

					<div class="space-y-4">
						<!-- Authentication Method -->
						<div class="flex items-center justify-between rounded-lg bg-gray-50 p-4">
							<div class="flex items-center gap-3">
								<div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
									<svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
								<div>
									<p class="font-medium text-gray-900">Google</p>
									<p class="text-sm text-gray-500">{user.email}</p>
								</div>
							</div>
							<div class="h-5 w-5 text-green-500">
								<svg fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</div>

						<!-- Organization Info -->
						<div class="grid grid-cols-1 gap-4">
							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">Organization ID</label>
								<p class="rounded border bg-gray-50 p-2 font-mono text-sm text-gray-900">
									{user.organizationId}
								</p>
							</div>

							<div>
								<label class="mb-1 block text-sm font-medium text-gray-700">User ID</label>
								<p class="rounded border bg-gray-50 p-2 font-mono text-sm text-gray-900">
									{user.userId}
								</p>
							</div>

							{#if publicKey}
								<div>
									<label class="mb-1 block text-sm font-medium text-gray-700">Public Key</label>
									<p
										class="rounded border bg-gray-50 p-2 font-mono text-sm break-all text-gray-900"
									>
										{publicKey}
									</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Logout Button -->
					<div class="mt-6 border-t border-gray-200 pt-6">
						<button
							onclick={handleLogout}
							class="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							Sign Out
						</button>
					</div>
				</div>

				<!-- Wallets Card -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
					<h2 class="mb-6 text-2xl font-bold text-gray-900">Wallets</h2>

					{#if user.wallets && user.wallets.length > 0}
						{#each user.wallets as wallet}
							<div class="mb-6">
								<h3 class="mb-4 text-lg font-semibold text-gray-800">{wallet.name}</h3>

								<div class="space-y-3">
									{#each wallet.accounts as account}
										<div
											class="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
										>
											<div class="flex items-center gap-3">
												<!-- Chain Icon -->
												<div
													class="flex h-8 w-8 items-center justify-center rounded-full {account.type ===
													'ETH'
														? 'bg-blue-100 text-blue-600'
														: 'bg-purple-100 text-purple-600'}"
												>
													{#if account.type === 'ETH'}
														<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
															<path
																d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.37 4.35h.001zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.354L12.056 0z"
															/>
														</svg>
													{:else}
														<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
															<path
																d="M12.102 1.257c-.274-.16-.622-.16-.896 0L2.08 6.257c-.274.16-.444.456-.444.773v9.94c0 .317.17.613.444.773l9.126 5c.274.16.622.16.896 0l9.126-5c.274-.16.444-.456.444-.773V7.03c0-.317-.17-.613-.444-.773L12.102 1.257z"
															/>
														</svg>
													{/if}
												</div>

												<!-- Address and Balance -->
												<div>
													<p class="font-mono text-sm text-gray-900">
														{formatAddress(account.address)}
													</p>
													<p class="text-xs text-gray-500">{account.balance}</p>
												</div>
											</div>

											<!-- Explorer Link -->
											<button
												onclick={() =>
													window.open(getExplorerUrl(account.address, account.type), '_blank')}
												class="p-2 text-gray-400 transition-colors hover:text-gray-600"
												aria-label="View on explorer"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
													/>
												</svg>
											</button>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{:else}
						<div class="py-8 text-center">
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
							>
								<svg
									class="h-8 w-8 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<p class="text-gray-500">No wallets found</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<p class="mb-4 text-gray-500">Failed to load user data</p>
			<button
				onclick={handleLogout}
				class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				Return to Login
			</button>
		</div>
	</div>
{/if}
