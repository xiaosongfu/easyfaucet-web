<script lang="ts">
	import "$lib/appkit";

	import favicon from "$lib/assets/favicon.svg";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div>
	<appkit-button></appkit-button>
</div>

<hr />

{@render children()}
