
```shell
$ npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem
```





```js
<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";

	//--------------------------------
	import { browser } from "$app/environment";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
	// import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
			},
		},
	});
	//--------------------------------

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<main>
		{@render children()}
	</main>
	<!-- <SvelteQueryDevtools /> -->
</QueryClientProvider>
```


```shell
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 9eab1b9bfbcdec2afc19a3aee63150a2" \
  -d '{"query": "{ newFaucets( orderBy: blockTimestamp orderDirection: asc where: {owner: \"0x031871c2Cc4B9139FcF79CCf3D1C137BDb2EA25A\"} ) { name faucet } }", "operationName": "Subgraphs", "variables": {}}' \
  https://api.studio.thegraph.com/query/1715532/easyfaucet-bnbtestnet/version/latest
```
