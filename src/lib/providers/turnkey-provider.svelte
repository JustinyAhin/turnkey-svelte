<script lang="ts">
	import {
		createTurnkeyState,
		setTurnkeyContext,
		type TurnkeyProviderConfig,
		type SessionType
	} from '$lib/client/states/turnkey/turnkey-state.svelte';

	interface Props {
		config: TurnkeyProviderConfig;
		session?: SessionType;
		children?: import('svelte').Snippet;
	}

	let { config, session = {}, children }: Props = $props();

	// Create the Turnkey state
	const turnkeyState = createTurnkeyState(config, session);

	// Set context for child components
	setTurnkeyContext(turnkeyState);

	// Reactive update when session prop changes
	$effect(() => {
		if (session) {
			turnkeyState.updateSession(session);
		}
	});
</script>

{@render children?.()}

<div id={turnkeyState.TurnkeyAuthIframeContainerId} style="hidden"></div>
