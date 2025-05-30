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

	// Reactive update when session prop changes - prevent loops
	$effect(() => {
		if (session && Object.keys(session).length > 0) {
			turnkeyState.updateSession(session);
		}
	});
</script>

{@render children?.()}

<!-- Hidden iframe container for Turnkey auth -->
<div
	id={turnkeyState.TurnkeyAuthIframeContainerId}
	style="display: none; position: absolute; top: -9999px; left: -9999px;"
></div>
