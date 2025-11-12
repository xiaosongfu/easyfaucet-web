<script lang="ts">
    import {
        writeContract,
        getAccount,
        readContract,
        watchAccount,
    } from "@wagmi/core";
    import { onMount } from "svelte";
    import { formatUnits } from "viem";
    import EasyFaucetFactoryAbi from "$lib/abi/EasyFaucetFactory.json";
    import EasyFaucetAbi from "$lib/abi/EasyFaucet.json";
    import {
        getCurrentChainConfig,
        isSupportedChain,
        type ChainConfig,
    } from "$lib/contracts";
    import { appKit, wagmiAdapter } from "$lib/appkit";
    import { _, locale } from "svelte-i18n";
    import { get } from "svelte/store";

    interface TokenInfo {
        address: string;
        name: string;
        decimals: number;
        balance: bigint;
    }

    interface FaucetInfo {
        name: string;
        address: string;
        owner: string;
        timestamp: number;
        chainId: number;
        tokens: TokenInfo[];
        isLoadingTokens: boolean;
    }

    let faucetName: string = "";
    let tokenAddresses: string[] = [""];
    let isCreating = false;
    let account: any = null;
    let isConnected = false;
    let userFaucets: FaucetInfo[] = [];
    let isLoadingFaucets = false;
    let loadingProgress = "";
    let toastMessage = "";
    let showToast = false;

    // 当前链配置
    let currentChainConfig: ChainConfig;
    let currentChainId: number | undefined;
    let isUnsupportedChain = false;

    // 添加代币相关状态
    let showAddTokenModal = false;
    let addTokenAddress = "";
    let addingTokenForFaucet: string | null = null;
    let isAddingToken = false;

    onMount(() => {
        // 获取初始账户状态
        if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
            account = getAccount(wagmiAdapter.wagmiConfig);
            isConnected = account?.isConnected || false;
            currentChainId = account?.chainId;

            // 更新链配置
            updateChainConfig(currentChainId);

            // 如果已连接且链支持，加载 faucet 列表
            if (isConnected && account?.address && !isUnsupportedChain) {
                loadUserFaucets();
            }

            // 监听链变化
            watchAccount(wagmiAdapter.wagmiConfig, {
                onChange(newAccount) {
                    const chainChanged = currentChainId !== newAccount?.chainId;
                    account = newAccount;
                    isConnected = newAccount?.isConnected || false;
                    currentChainId = newAccount?.chainId;

                    // 更新链配置
                    updateChainConfig(currentChainId);

                    // 链变化或账户变化时重新加载
                    if (chainChanged || (isConnected && newAccount?.address)) {
                        if (!isUnsupportedChain) {
                            loadUserFaucets();
                        } else {
                            userFaucets = [];
                        }
                    } else if (!isConnected) {
                        userFaucets = [];
                    }
                },
            });
        }

        // 监听 AppKit 状态变化
        if (appKit) {
            appKit.subscribeAccount((newAccount) => {
                if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
                    account = getAccount(wagmiAdapter.wagmiConfig);
                    isConnected = account?.isConnected || false;
                    currentChainId = account?.chainId;

                    updateChainConfig(currentChainId);

                    if (
                        isConnected &&
                        account?.address &&
                        !isUnsupportedChain
                    ) {
                        loadUserFaucets();
                    } else {
                        userFaucets = [];
                    }
                }
            });
        }
    });

    function updateChainConfig(chainId: number | undefined) {
        currentChainConfig = getCurrentChainConfig(chainId);
        isUnsupportedChain = chainId ? !isSupportedChain(chainId) : false;
        console.log("当前链配置:", {
            chainId,
            chainName: currentChainConfig.chainName,
            isSupported: !isUnsupportedChain,
        });
    }

    async function loadUserFaucets() {
        if (!account?.address || !wagmiAdapter?.wagmiConfig) {
            return;
        }

        try {
            isLoadingFaucets = true;
            loadingProgress = get(_)(
                "dashboard.loadingProgress.queryingEvents",
            );

            // 使用 The Graph API 查询
            const graphApiUrl = currentChainConfig.graphApiUrl;
            const query = `
                query GetUserFaucets($owner: String!) {
                    newFaucets(
                        orderBy: blockTimestamp
                        orderDirection: desc
                        where: { owner: $owner }
                    ) {
                        id
                        name
                        faucet
                        owner
                        blockTimestamp
                    }
                }
            `;

            loadingProgress = get(_)(
                "dashboard.loadingProgress.queryingEvents",
            );

            const response = await fetch(graphApiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    variables: {
                        owner: account.address.toLowerCase(),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(
                    `Graph API 请求失败: ${response.status} ${response.statusText}`,
                );
            }

            const result = await response.json();

            if (result.errors) {
                throw new Error(
                    `Graph API 查询错误: ${JSON.stringify(result.errors)}`,
                );
            }

            const faucetsFromGraph = result.data?.newFaucets || [];

            if (faucetsFromGraph.length === 0) {
                userFaucets = [];
                loadingProgress = "";
                return;
            }

            loadingProgress = get(_)("dashboard.loadingProgress.parsingData");

            // 解析 Graph API 返回的数据
            const faucetsData: FaucetInfo[] = faucetsFromGraph.map(
                (item: any) => ({
                    owner: item.owner,
                    name: item.name,
                    address: item.faucet,
                    timestamp: Number(item.blockTimestamp),
                    chainId: currentChainId!,
                    tokens: [],
                    isLoadingTokens: false,
                }),
            );

            console.log("从 Graph API 加载到的 Faucet 列表:", faucetsData);

            loadingProgress = get(_)("dashboard.loadingProgress.loadingTokens");

            // 批量加载所有代币信息（不触发中间更新）
            await Promise.all(
                faucetsData.map(async (faucet) => {
                    if (!wagmiAdapter?.wagmiConfig) {
                        return;
                    }

                    try {
                        const result = await readContract(
                            wagmiAdapter.wagmiConfig,
                            {
                                address: faucet.address as `0x${string}`,
                                abi: EasyFaucetAbi,
                                functionName: "tokenInfos",
                            },
                        );

                        const [addresses, names, decimals, balances] =
                            result as [string[], string[], number[], bigint[]];

                        faucet.tokens = addresses.map((addr, i) => ({
                            address: addr,
                            name: names[i],
                            decimals: decimals[i],
                            balance: balances[i],
                        }));
                    } catch (error) {
                        console.error(
                            `加载 Faucet ${faucet.name} 的代币信息失败:`,
                            error,
                        );
                        faucet.tokens = [];
                    }
                }),
            );

            // 一次性更新所有数据（只触发一次响应式更新）
            userFaucets = faucetsData;
            loadingProgress = "";
        } catch (error) {
            console.error("加载 Faucet 列表失败:", error);
            alert("加载 Faucet 列表失败: " + (error as Error).message);
            loadingProgress = "";
        } finally {
            isLoadingFaucets = false;
        }
    }

    function formatBalance(balance: bigint, decimals: number): string {
        return formatUnits(balance, decimals);
    }

    async function copyToClipboard(text: string, label: string = "") {
        try {
            await navigator.clipboard.writeText(text);
            const message = label || get(_)("dashboard.messages.addressCopied");
            showToastMessage(message);
        } catch (error) {
            console.error("复制失败:", error);
            showToastMessage(get(_)("dashboard.messages.copyError"), true);
        }
    }

    async function shareFaucet(faucet: FaucetInfo) {
        try {
            const url = `${window.location.origin}/faucet/${faucet.chainId}/${faucet.address}`;
            await navigator.clipboard.writeText(url);
            showToastMessage(get(_)("dashboard.messages.shareSuccess"));
        } catch (error) {
            console.error("分享失败:", error);
            showToastMessage(get(_)("dashboard.messages.shareError"), true);
        }
    }

    function showToastMessage(message: string, isError: boolean = false) {
        toastMessage = message;
        showToast = true;

        setTimeout(() => {
            showToast = false;
        }, 2000);
    }

    function formatDate(timestamp: number): string {
        if (!timestamp) return get(_)("dashboard.time.unknown");
        const date = new Date(timestamp * 1000);
        const currentLocale = get(locale) || "zh";
        const localeCode = currentLocale === "zh" ? "zh-CN" : "en-US";
        return date.toLocaleString(localeCode, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatRelativeTime(timestamp: number): string {
        if (!timestamp) return get(_)("dashboard.time.unknown");
        const now = Date.now();
        const diff = now - timestamp * 1000;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} ${get(_)("dashboard.time.daysAgo")}`;
        if (hours > 0) return `${hours} ${get(_)("dashboard.time.hoursAgo")}`;
        if (minutes > 0)
            return `${minutes} ${get(_)("dashboard.time.minutesAgo")}`;
        return get(_)("dashboard.time.justNow");
    }

    function openAddTokenModal(faucetAddress: string) {
        addingTokenForFaucet = faucetAddress;
        addTokenAddress = "";
        showAddTokenModal = true;
    }

    function closeAddTokenModal() {
        showAddTokenModal = false;
        addTokenAddress = "";
        addingTokenForFaucet = null;
    }

    async function addToken() {
        if (!addingTokenForFaucet) {
            return;
        }

        if (!addTokenAddress || addTokenAddress.trim() === "") {
            alert(get(_)("dashboard.messages.enterAddress"));
            return;
        }

        // 验证地址格式
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!addressRegex.test(addTokenAddress)) {
            alert(get(_)("dashboard.messages.invalidAddress"));
            return;
        }

        if (!account?.address) {
            alert(get(_)("dashboard.messages.connectWallet"));
            return;
        }

        if (!wagmiAdapter?.wagmiConfig) {
            alert("Wagmi 配置未初始化");
            return;
        }

        try {
            isAddingToken = true;

            const result = await writeContract(wagmiAdapter.wagmiConfig, {
                address: addingTokenForFaucet as `0x${string}`,
                abi: EasyFaucetAbi,
                functionName: "addToken",
                args: [addTokenAddress],
            });

            console.log("添加代币交易已提交:", result);
            showToastMessage(get(_)("dashboard.messages.addTokenSuccess"));

            // 关闭弹窗
            closeAddTokenModal();

            // 延迟重新加载列表
            setTimeout(() => {
                loadUserFaucets();
            }, 3000);
        } catch (error) {
            console.error("添加代币失败:", error);
            alert(
                get(_)("dashboard.messages.addTokenError") +
                    ": " +
                    (error as Error).message,
            );
        } finally {
            isAddingToken = false;
        }
    }

    function addTokenInput() {
        tokenAddresses = [...tokenAddresses, ""];
    }

    function removeTokenInput(index: number) {
        if (tokenAddresses.length > 1) {
            tokenAddresses = tokenAddresses.filter((_, i) => i !== index);
        }
    }

    function updateTokenAddress(index: number, value: string) {
        tokenAddresses[index] = value;
        tokenAddresses = [...tokenAddresses]; // 触发响应式更新
    }

    async function newFaucet() {
        if (!isConnected || !account?.address) {
            alert($_("dashboard.messages.connectWallet"));
            return;
        }

        if (faucetName.trim() === "") {
            alert($_("dashboard.messages.enterName"));
            return;
        }

        // 过滤掉空的地址
        const validTokens = tokenAddresses.filter((addr) => addr.trim() !== "");

        if (validTokens.length === 0) {
            alert($_("dashboard.messages.atLeastOneToken"));
            return;
        }

        // 验证地址格式
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        for (const token of validTokens) {
            if (!addressRegex.test(token)) {
                alert(`${$_("dashboard.messages.invalidAddress")}: ${token}`);
                return;
            }
        }

        try {
            isCreating = true;

            if (!wagmiAdapter || !wagmiAdapter.wagmiConfig) {
                throw new Error("Wagmi 配置未初始化");
            }

            const result = await writeContract(wagmiAdapter.wagmiConfig, {
                abi: EasyFaucetFactoryAbi,
                address: currentChainConfig.factoryAddress,
                functionName: "newFaucet",
                args: [
                    currentChainConfig.beaconAddress,
                    account.address,
                    faucetName.trim(),
                    validTokens,
                ],
            });

            console.log("交易提交成功:", result);
            alert($_("dashboard.messages.createSuccess"));

            // 重置表单
            faucetName = "";
            tokenAddresses = [""];

            // 延迟重新加载列表，等待交易确认
            setTimeout(() => {
                loadUserFaucets();
            }, 3000);
        } catch (error) {
            console.error("创建 Faucet 失败:", error);
            alert(
                $_("dashboard.messages.createError") +
                    ": " +
                    (error as Error).message,
            );
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="dashboard-container">
    <!-- 不支持的链提示 -->
    {#if isUnsupportedChain}
        <div class="unsupported-chain-warning">
            <h2>⚠️ {$_("dashboard.unsupportedChain.title")}</h2>
            <p>{$_("dashboard.unsupportedChain.description")}</p>
            <ul>
                <li>{$_("dashboard.unsupportedChain.bscTestnet")}</li>
                <li>{$_("dashboard.unsupportedChain.sepolia")}</li>
            </ul>
        </div>
    {:else if currentChainId}
        <div class="chain-info">
            <span class="chain-badge">
                🌐 {currentChainConfig.chainName}
            </span>
        </div>
    {/if}

    <div class="create-faucet-section">
        <h2>{$_("dashboard.createFaucet.title")}</h2>

        <div class="form-group">
            <label for="faucet-name">{$_("dashboard.createFaucet.name")}</label>
            <input
                type="text"
                id="faucet-name"
                class="name-input"
                bind:value={faucetName}
                placeholder={$_("dashboard.createFaucet.namePlaceholder")}
                disabled={!isConnected || isUnsupportedChain}
            />
        </div>

        <div class="form-group">
            <label for="token-addresses"
                >{$_("dashboard.createFaucet.tokenAddresses")}</label
            >
            {#each tokenAddresses as address, index}
                <div class="token-input-row">
                    <input
                        type="text"
                        placeholder="0x..."
                        value={address}
                        oninput={(e) =>
                            updateTokenAddress(
                                index,
                                (e.target as HTMLInputElement)?.value || "",
                            )}
                        class="token-input"
                        disabled={isCreating}
                        id={index === 0 ? "token-addresses" : undefined}
                    />
                    {#if tokenAddresses.length > 1}
                        <button
                            type="button"
                            class="remove-btn"
                            onclick={() => removeTokenInput(index)}
                            disabled={isCreating}
                        >
                            {$_("dashboard.createFaucet.remove")}
                        </button>
                    {/if}
                </div>
            {/each}

            <button
                type="button"
                onclick={addTokenInput}
                class="add-btn"
                disabled={isCreating}
            >
                {$_("dashboard.createFaucet.addToken")}
            </button>
        </div>

        <button
            class="create-btn"
            onclick={newFaucet}
            disabled={isCreating || !isConnected || isUnsupportedChain}
        >
            {isCreating
                ? $_("dashboard.createFaucet.creating")
                : $_("dashboard.createFaucet.create")}
        </button>
    </div>

    <div class="faucet-list-section">
        <div class="list-header">
            <h2>{$_("dashboard.faucetList.title")}</h2>
            {#if isConnected}
                <button
                    class="refresh-btn"
                    onclick={loadUserFaucets}
                    disabled={isLoadingFaucets || isUnsupportedChain}
                >
                    {$_("dashboard.faucetList.refresh")}
                </button>
            {/if}
        </div>

        {#if !isConnected}
            <p class="empty-message">
                {$_("dashboard.faucetList.connectPrompt")}
            </p>
        {:else if isLoadingFaucets}
            <div class="loading-container">
                <p class="loading-message">
                    {$_("dashboard.faucetList.loading")}
                </p>
                {#if loadingProgress}
                    <p class="loading-progress">{loadingProgress}</p>
                {/if}
            </div>
        {:else if userFaucets.length === 0}
            <div class="empty-container">
                <p class="empty-message">{$_("dashboard.faucetList.empty")}</p>
            </div>
        {:else}
            <div class="faucet-list">
                {#each userFaucets as faucet}
                    <div class="faucet-item">
                        <div class="faucet-info">
                            <h3>{faucet.name}</h3>
                            <p class="faucet-address">
                                <span class="address-label"
                                    >{$_("dashboard.faucetList.address")}:</span
                                >
                                <span class="address-text"
                                    >{faucet.address}</span
                                >
                                <button
                                    class="copy-btn"
                                    onclick={() =>
                                        copyToClipboard(
                                            faucet.address,
                                            "Faucet 地址",
                                        )}
                                    title="复制地址"
                                    aria-label="复制 Faucet 地址"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect
                                            x="9"
                                            y="9"
                                            width="13"
                                            height="13"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <path
                                            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                        ></path>
                                    </svg>
                                </button>
                            </p>
                            <p class="faucet-time">
                                <span class="time-label"
                                    >{$_(
                                        "dashboard.faucetList.createdTime",
                                    )}:</span
                                >
                                <span
                                    class="time-text"
                                    title={formatDate(faucet.timestamp)}
                                >
                                    {formatRelativeTime(faucet.timestamp)}
                                </span>
                            </p>

                            {#if faucet.isLoadingTokens}
                                <p class="token-loading">
                                    {$_("dashboard.faucetList.loadingTokens")}
                                </p>
                            {:else if faucet.tokens.length > 0}
                                <div class="token-list">
                                    <p class="token-list-title">
                                        <strong
                                            >{$_(
                                                "dashboard.faucetList.tokenList",
                                            )}:</strong
                                        >
                                    </p>
                                    {#each faucet.tokens as token}
                                        <div class="token-item">
                                            <span class="token-name"
                                                >{token.name}</span
                                            >
                                            <span class="token-balance">
                                                {$_(
                                                    "dashboard.faucetList.balance",
                                                )}: {formatBalance(
                                                    token.balance,
                                                    token.decimals,
                                                )}
                                            </span>
                                            <span class="token-address-short">
                                                {token.address.slice(
                                                    0,
                                                    6,
                                                )}...{token.address.slice(-4)}
                                            </span>
                                            <button
                                                class="copy-btn copy-btn-small"
                                                onclick={() =>
                                                    copyToClipboard(
                                                        token.address,
                                                        `${token.name} 地址`,
                                                    )}
                                                title="复制代币地址"
                                                aria-label="复制代币地址"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <rect
                                                        x="9"
                                                        y="9"
                                                        width="13"
                                                        height="13"
                                                        rx="2"
                                                        ry="2"
                                                    ></rect>
                                                    <path
                                                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                                    ></path>
                                                </svg>
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <p class="no-tokens">
                                    {$_("dashboard.faucetList.noTokens")}
                                </p>
                            {/if}
                        </div>
                        <div class="faucet-actions">
                            <button
                                class="add-token-btn"
                                onclick={() =>
                                    openAddTokenModal(faucet.address)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                {$_("dashboard.faucetList.addToken")}
                            </button>
                            <button
                                class="share-faucet-btn"
                                onclick={() => shareFaucet(faucet)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line
                                        x1="8.59"
                                        y1="13.51"
                                        x2="15.42"
                                        y2="17.49"
                                    ></line>
                                    <line
                                        x1="15.41"
                                        y1="6.51"
                                        x2="8.59"
                                        y2="10.49"
                                    ></line>
                                </svg>
                                {$_("dashboard.faucetList.share")}
                            </button>
                            <a
                                href={`/faucet/${faucet.chainId}/${faucet.address}`}
                                class="view-btn"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                查看
                            </a>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Toast 提示 -->
    {#if showToast}
        <div class="toast">
            {toastMessage}
        </div>
    {/if}

    <!-- 添加代币弹窗 -->
    {#if showAddTokenModal}
        <div
            class="modal-overlay"
            onclick={closeAddTokenModal}
            onkeydown={(e) => e.key === "Escape" && closeAddTokenModal()}
            role="button"
            tabindex="0"
            aria-label="关闭弹窗"
        >
            <div
                class="modal-content"
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="modal-title"
                tabindex="-1"
            >
                <div class="modal-header">
                    <h2 id="modal-title">
                        {$_("dashboard.addTokenModal.title")}
                    </h2>
                    <button
                        class="modal-close"
                        onclick={closeAddTokenModal}
                        aria-label="关闭弹窗"
                        title="关闭"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="token-address"
                            >{$_("dashboard.addTokenModal.label")}:</label
                        >
                        <input
                            type="text"
                            id="token-address"
                            bind:value={addTokenAddress}
                            placeholder={$_(
                                "dashboard.addTokenModal.placeholder",
                            )}
                            class="modal-input"
                            disabled={isAddingToken}
                        />
                    </div>
                </div>
                <div class="modal-footer">
                    <button
                        class="modal-btn modal-btn-cancel"
                        onclick={closeAddTokenModal}
                        disabled={isAddingToken}
                    >
                        {$_("dashboard.addTokenModal.cancel")}
                    </button>
                    <button
                        class="modal-btn modal-btn-confirm"
                        onclick={addToken}
                        disabled={isAddingToken}
                    >
                        {isAddingToken
                            ? $_("dashboard.addTokenModal.confirming")
                            : $_("dashboard.addTokenModal.confirm")}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        color: white;
        min-height: 100vh;
    }

    /* 不支持的链警告 */
    .unsupported-chain-warning {
        background: rgba(255, 193, 7, 0.1);
        border: 2px solid rgba(255, 193, 7, 0.5);
        border-radius: 20px;
        padding: 2.5rem;
        margin-bottom: 2rem;
        text-align: center;
    }

    .unsupported-chain-warning h2 {
        color: #ffc107;
        margin: 0 0 1rem 0;
        font-size: 1.8rem;
    }

    .unsupported-chain-warning p {
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
    }

    .unsupported-chain-warning ul {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0 0;
    }

    .unsupported-chain-warning li {
        color: rgba(255, 255, 255, 0.9);
        padding: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
    }

    /* 链信息徽章 */
    .chain-info {
        text-align: center;
        margin-bottom: 2rem;
    }

    .chain-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(102, 126, 234, 0.2);
        border: 1px solid rgba(102, 126, 234, 0.5);
        border-radius: 50px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        backdrop-filter: blur(10px);
    }

    .create-faucet-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2.5rem;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    }

    .create-faucet-section:hover {
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    }

    h2 {
        color: white;
        margin-bottom: 2rem;
        font-size: 1.8rem;
        font-weight: 700;
    }

    .form-group {
        margin-bottom: 2rem;
    }

    label {
        display: block;
        margin-bottom: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        font-size: 1rem;
    }

    .name-input {
        width: 100%;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        font-size: 1rem;
        box-sizing: border-box;
        color: white;
        transition: all 0.2s;
    }

    .name-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        background: rgba(255, 255, 255, 0.08);
    }

    .name-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    .token-input-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
        gap: 0.75rem;
    }

    .token-input {
        flex: 1;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        font-size: 0.95rem;
        font-family: monospace;
        color: white;
        transition: all 0.2s;
    }

    .token-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        background: rgba(255, 255, 255, 0.08);
    }

    .token-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    .remove-btn {
        background: rgba(220, 53, 69, 0.8);
        color: white;
        border: 1px solid rgba(220, 53, 69, 0.5);
        padding: 0.875rem 1.25rem;
        border-radius: 12px;
        cursor: pointer;
        white-space: nowrap;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .remove-btn:hover {
        background: #dc3545;
        border-color: #dc3545;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    }

    .add-btn {
        background: rgba(40, 167, 69, 0.8);
        color: white;
        border: 1px solid rgba(40, 167, 69, 0.5);
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        cursor: pointer;
        margin-top: 0.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .add-btn:hover {
        background: #28a745;
        border-color: #28a745;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
    }

    .create-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 1.25rem 2.5rem;
        border-radius: 12px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 700;
        width: 100%;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .create-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.6);
    }

    .create-btn:active:not(:disabled) {
        transform: translateY(-1px);
    }

    .create-btn:disabled {
        background: rgba(108, 117, 125, 0.5);
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .faucet-list-section {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2.5rem;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        margin-top: 3rem;
        transition: all 0.3s ease;
    }

    .faucet-list-section:hover {
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .list-header h2 {
        margin: 0;
        color: white;
    }

    .refresh-btn {
        background: rgba(108, 117, 125, 0.6);
        color: white;
        border: 1px solid rgba(108, 117, 125, 0.5);
        padding: 0.65rem 1.25rem;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .refresh-btn:hover:not(:disabled) {
        background: #6c757d;
        border-color: #6c757d;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
    }

    .empty-message,
    .loading-message {
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        padding: 3rem;
        font-size: 1.1rem;
    }

    .loading-container {
        text-align: center;
        padding: 2rem;
    }

    .loading-progress {
        color: #999;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }

    .empty-container {
        text-align: center;
        padding: 2rem;
    }

    .block-range-info {
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
        margin-top: 1.5rem;
        font-style: italic;
    }

    .faucet-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .faucet-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.03);
        transition: all 0.3s ease;
    }

    .faucet-item:hover {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.06);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        transform: translateY(-2px);
    }

    .faucet-info {
        flex: 1;
    }

    .faucet-info h3 {
        margin: 0 0 0.75rem 0;
        color: white;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .faucet-address {
        margin: 0.75rem 0 0.5rem 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        word-break: break-all;
    }

    .faucet-time {
        margin: 0.5rem 0 0.75rem 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .time-label {
        color: rgba(255, 255, 255, 0.5);
    }

    .time-text {
        color: rgba(255, 255, 255, 0.7);
        font-style: italic;
        cursor: help;
    }

    .address-text {
        font-family: monospace;
        font-size: 0.9rem;
        color: #667eea;
    }

    .copy-btn {
        background: transparent;
        border: 1px solid transparent;
        cursor: pointer;
        padding: 0.25rem;
        margin-left: 0.5rem;
        transition: all 0.2s;
        vertical-align: middle;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #666;
    }

    .copy-btn:hover {
        background: #f0f0f0;
        border-color: #ddd;
        color: #007bff;
    }

    .copy-btn:active {
        transform: scale(0.95);
        background: #e0e0e0;
    }

    .copy-btn-small {
        padding: 0.15rem;
        margin-left: 0.3rem;
    }

    .copy-btn svg {
        display: block;
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #333;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .token-loading,
    .no-tokens {
        margin-top: 1rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.95rem;
        font-style: italic;
    }

    .token-list {
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .token-list-title {
        margin: 0 0 0.75rem 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        font-weight: 600;
    }

    .token-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        margin-bottom: 0.5rem;
        transition: all 0.2s;
    }

    .token-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .token-name {
        font-weight: 700;
        color: white;
        min-width: 80px;
    }

    .token-balance {
        color: #4ade80;
        font-family: monospace;
        flex: 1;
        font-weight: 600;
    }

    .token-address-short {
        font-family: monospace;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
    }

    .faucet-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-left: 1rem;
        align-self: center;
    }

    .add-token-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: rgba(40, 167, 69, 0.8);
        color: white;
        border: 1px solid rgba(40, 167, 69, 0.5);
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    }

    .add-token-btn:hover {
        background: #28a745;
        border-color: #28a745;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(40, 167, 69, 0.5);
    }

    .add-token-btn svg {
        flex-shrink: 0;
    }

    .share-faucet-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: rgba(102, 126, 234, 0.2);
        color: white;
        border: 1px solid rgba(102, 126, 234, 0.5);
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
        white-space: nowrap;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .share-faucet-btn:hover {
        background: rgba(102, 126, 234, 0.3);
        border-color: rgba(102, 126, 234, 0.7);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    .share-faucet-btn svg {
        flex-shrink: 0;
    }

    .view-btn {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        cursor: pointer;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
        text-align: center;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .view-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    /* Modal 样式 */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-content {
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: white;
        font-weight: 700;
    }

    .modal-close {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.8);
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .modal-close:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-input {
        width: 100%;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        font-size: 1rem;
        font-family: monospace;
        box-sizing: border-box;
        color: white;
        transition: all 0.2s;
    }

    .modal-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        background: rgba(255, 255, 255, 0.08);
    }

    .modal-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    .modal-input:disabled {
        background: rgba(255, 255, 255, 0.02);
        cursor: not-allowed;
        opacity: 0.6;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
    }

    .modal-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .modal-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .modal-btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
    }

    .modal-btn-cancel:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .modal-btn-confirm {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .modal-btn-confirm:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }
</style>
