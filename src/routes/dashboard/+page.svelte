<script lang="ts">
    import {
        writeContract,
        getAccount,
        getPublicClient,
        readContract,
    } from "@wagmi/core";
    import { onMount } from "svelte";
    import { formatUnits } from "viem";
    import EasyFaucetFactoryAbi from "$lib/abi/EasyFaucetFactory.json";
    import EasyFaucetAbi from "$lib/abi/EasyFaucet.json";
    import {
        EasyFaucetFactoryAddress,
        EasyFaucetBeaconAddress,
        EasyFaucetFactoryDeployBlock,
    } from "$lib/contracts";
    import { appKit, wagmiAdapter } from "$lib/appkit";

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
        blockNumber: bigint;
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
    let queriedBlockRange = "";
    let toastMessage = "";
    let showToast = false;

    onMount(() => {
        // 获取初始账户状态
        if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
            account = getAccount(wagmiAdapter.wagmiConfig);
            isConnected = account?.isConnected || false;

            // 如果已连接，加载 faucet 列表
            if (isConnected && account?.address) {
                loadUserFaucets();
            }
        }

        // 监听 AppKit 状态变化
        if (appKit) {
            appKit.subscribeAccount((newAccount) => {
                account = newAccount;
                isConnected = newAccount?.isConnected || false;

                // 账户变化时重新加载 faucet 列表
                if (isConnected && newAccount?.address) {
                    loadUserFaucets();
                } else {
                    userFaucets = [];
                }
            });
        }
    });

    async function loadUserFaucets() {
        if (!account?.address || !wagmiAdapter?.wagmiConfig) {
            return;
        }

        try {
            isLoadingFaucets = true;
            loadingProgress = "正在连接...";
            const publicClient = getPublicClient(wagmiAdapter.wagmiConfig);

            if (!publicClient) {
                throw new Error("Public client 未初始化");
            }

            // 获取最新区块号
            loadingProgress = "获取区块信息...";
            const latestBlock = await publicClient.getBlockNumber();

            // 合约部署的起始区块
            const CONTRACT_DEPLOY_BLOCK = EasyFaucetFactoryDeployBlock;

            // 定义每批查询的区块范围（500 个区块）
            const BLOCK_RANGE = 499n;
            let allLogs: any[] = [];

            // 从合约部署区块开始查询到最新区块
            let fromBlock = CONTRACT_DEPLOY_BLOCK;
            let toBlock = fromBlock + BLOCK_RANGE;
            if (toBlock > latestBlock) {
                toBlock = latestBlock;
            }

            // 计算需要查询的批次数
            const totalBlocks = latestBlock - CONTRACT_DEPLOY_BLOCK;
            const totalBatches = Math.ceil(
                Number(totalBlocks) / (Number(BLOCK_RANGE) + 1),
            );
            let batchCount = 0;

            while (fromBlock <= latestBlock) {
                try {
                    loadingProgress = `查询区块 ${fromBlock} - ${toBlock} (${batchCount + 1}/${totalBatches})`;
                    const logs = await publicClient.getLogs({
                        address: EasyFaucetFactoryAddress,
                        event: {
                            type: "event",
                            name: "NewFaucet",
                            inputs: [
                                {
                                    indexed: true,
                                    name: "owner",
                                    type: "address",
                                },
                                {
                                    indexed: false,
                                    name: "name",
                                    type: "string",
                                },
                                {
                                    indexed: false,
                                    name: "faucet",
                                    type: "address",
                                },
                            ],
                        },
                        args: {
                            owner: account.address,
                        },
                        fromBlock: fromBlock,
                        toBlock: toBlock,
                    });

                    allLogs = allLogs.concat(logs);

                    // 准备下一批查询
                    fromBlock = toBlock + 1n;
                    toBlock = fromBlock + BLOCK_RANGE;
                    if (toBlock > latestBlock) {
                        toBlock = latestBlock;
                    }
                    batchCount++;

                    // 如果已经到达最新区块，停止查询
                    if (fromBlock > latestBlock) {
                        break;
                    }
                } catch (batchError) {
                    console.error(
                        `查询区块 ${fromBlock} - ${toBlock} 失败:`,
                        batchError,
                    );
                    // 如果某一批查询失败，继续查询下一批
                    fromBlock = toBlock + 1n;
                    toBlock = fromBlock + BLOCK_RANGE;
                    if (toBlock > latestBlock) {
                        toBlock = latestBlock;
                    }
                    batchCount++;

                    // 如果已经到达最新区块，停止查询
                    if (fromBlock > latestBlock) {
                        break;
                    }
                }
            }

            loadingProgress = "解析数据...";
            // 解析事件数据
            userFaucets = allLogs.map((log) => {
                return {
                    owner: log.args.owner as string,
                    name: log.args.name as string,
                    address: log.args.faucet as string,
                    blockNumber: log.blockNumber,
                    tokens: [],
                    isLoadingTokens: false,
                };
            });

            // 按区块号降序排序（最新的在前）
            userFaucets.sort((a, b) => Number(b.blockNumber - a.blockNumber));

            console.log("加载到的 Faucet 列表:", userFaucets);

            // 加载每个 Faucet 的代币信息
            await loadTokenInfosForAllFaucets();
            loadingProgress = "";

            // 记录查询的区块范围
            queriedBlockRange = `已查询区块: ${CONTRACT_DEPLOY_BLOCK} - ${latestBlock} (共 ${Number(latestBlock - CONTRACT_DEPLOY_BLOCK + 1n)} 个区块)`;
        } catch (error) {
            console.error("加载 Faucet 列表失败:", error);
            alert("加载 Faucet 列表失败: " + (error as Error).message);
            loadingProgress = "";
        } finally {
            isLoadingFaucets = false;
        }
    }

    async function loadTokenInfosForAllFaucets() {
        if (!wagmiAdapter?.wagmiConfig) {
            return;
        }

        // 并行加载所有 Faucet 的代币信息
        const promises = userFaucets.map((faucet, index) =>
            loadTokenInfoForFaucet(index),
        );

        await Promise.all(promises);
    }

    async function loadTokenInfoForFaucet(index: number) {
        if (!wagmiAdapter?.wagmiConfig) {
            return;
        }

        const faucet = userFaucets[index];
        faucet.isLoadingTokens = true;
        userFaucets = [...userFaucets]; // 触发响应式更新

        try {
            const result = await readContract(wagmiAdapter.wagmiConfig, {
                address: faucet.address as `0x${string}`,
                abi: EasyFaucetAbi,
                functionName: "tokenInfos",
            });

            // result 是一个包含 4 个数组的元组
            const [addresses, names, decimals, balances] = result as [
                string[],
                string[],
                number[],
                bigint[],
            ];

            // 组合成代币信息数组
            faucet.tokens = addresses.map((addr, i) => ({
                address: addr,
                name: names[i],
                decimals: decimals[i],
                balance: balances[i],
            }));

            console.log(`Faucet ${faucet.name} 的代币信息:`, faucet.tokens);
        } catch (error) {
            console.error(`加载 Faucet ${faucet.name} 的代币信息失败:`, error);
            faucet.tokens = [];
        } finally {
            faucet.isLoadingTokens = false;
            userFaucets = [...userFaucets]; // 触发响应式更新
        }
    }

    function formatBalance(balance: bigint, decimals: number): string {
        return formatUnits(balance, decimals);
    }

    async function copyToClipboard(text: string, label: string = "地址") {
        try {
            await navigator.clipboard.writeText(text);
            showToastMessage(`${label}已复制`);
        } catch (error) {
            console.error("复制失败:", error);
            showToastMessage("复制失败", true);
        }
    }

    function showToastMessage(message: string, isError: boolean = false) {
        toastMessage = message;
        showToast = true;

        setTimeout(() => {
            showToast = false;
        }, 2000);
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
            alert("请先连接钱包");
            return;
        }

        if (faucetName.trim() === "") {
            alert("请输入 Faucet 名称");
            return;
        }

        // 过滤掉空的地址
        const validTokens = tokenAddresses.filter((addr) => addr.trim() !== "");

        if (validTokens.length === 0) {
            alert("请至少输入一个代币地址");
            return;
        }

        // 验证地址格式
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        for (const token of validTokens) {
            if (!addressRegex.test(token)) {
                alert(`无效的地址格式: ${token}`);
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
                address: EasyFaucetFactoryAddress,
                functionName: "newFaucet",
                args: [
                    EasyFaucetBeaconAddress,
                    account.address,
                    faucetName.trim(),
                    validTokens,
                ],
            });

            console.log("交易提交成功:", result);
            alert("Faucet 创建交易已提交，请等待确认");

            // 重置表单
            faucetName = "";
            tokenAddresses = [""];

            // 延迟重新加载列表，等待交易确认
            setTimeout(() => {
                loadUserFaucets();
            }, 3000);
        } catch (error) {
            console.error("创建 Faucet 失败:", error);
            alert("创建 Faucet 失败: " + (error as Error).message);
        } finally {
            isCreating = false;
        }
    }
</script>

<div class="dashboard-container">
    <h1>Dashboard</h1>

    <div class="create-faucet-section">
        <h2>创建新的 Faucet</h2>

        <div class="form-group">
            <label for="faucet-name">Faucet 名称:</label>
            <input
                type="text"
                id="faucet-name"
                placeholder="请输入 Faucet 名称"
                bind:value={faucetName}
                class="name-input"
                disabled={isCreating}
            />
        </div>

        <div class="form-group">
            <label for="token-addresses">代币地址:</label>
            {#each tokenAddresses as address, index}
                <div class="token-input-row">
                    <input
                        type="text"
                        placeholder="0x..."
                        value={address}
                        on:input={(e) =>
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
                            on:click={() => removeTokenInput(index)}
                            class="remove-btn"
                            disabled={isCreating}
                        >
                            移除
                        </button>
                    {/if}
                </div>
            {/each}

            <button
                type="button"
                on:click={addTokenInput}
                class="add-btn"
                disabled={isCreating}
            >
                + 添加代币地址
            </button>
        </div>

        <button
            class="create-btn"
            on:click={newFaucet}
            disabled={!isConnected || isCreating}
        >
            {isCreating ? "创建中..." : "创建 Faucet"}
        </button>
    </div>

    <div class="faucet-list-section">
        <div class="list-header">
            <h2>我的 Faucet 列表</h2>
            {#if isConnected}
                <button
                    class="refresh-btn"
                    on:click={loadUserFaucets}
                    disabled={isLoadingFaucets}
                >
                    {isLoadingFaucets ? "加载中..." : "刷新"}
                </button>
            {/if}
        </div>

        {#if !isConnected}
            <p class="empty-message">请先连接钱包查看您的 Faucet 列表</p>
        {:else if isLoadingFaucets}
            <div class="loading-container">
                <p class="loading-message">加载中...</p>
                {#if loadingProgress}
                    <p class="loading-progress">{loadingProgress}</p>
                {/if}
            </div>
        {:else if userFaucets.length === 0}
            <div class="empty-container">
                <p class="empty-message">您还没有创建任何 Faucet</p>
                {#if queriedBlockRange}
                    <p class="block-range-info">{queriedBlockRange}</p>
                {/if}
            </div>
        {:else}
            <div class="faucet-list">
                {#each userFaucets as faucet}
                    <div class="faucet-item">
                        <div class="faucet-info">
                            <h3>{faucet.name}</h3>
                            <p class="faucet-address">
                                <strong>地址:</strong>
                                <span class="address-text"
                                    >{faucet.address}</span
                                >
                                <button
                                    class="copy-btn"
                                    on:click={() =>
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

                            {#if faucet.isLoadingTokens}
                                <p class="token-loading">加载代币信息中...</p>
                            {:else if faucet.tokens.length > 0}
                                <div class="token-list">
                                    <p class="token-list-title">
                                        <strong>代币列表:</strong>
                                    </p>
                                    {#each faucet.tokens as token}
                                        <div class="token-item">
                                            <span class="token-name"
                                                >{token.name}</span
                                            >
                                            <span class="token-balance">
                                                余额: {formatBalance(
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
                                                on:click={() =>
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
                                <p class="no-tokens">暂无代币</p>
                            {/if}
                        </div>
                        <div class="faucet-actions">
                            <a
                                href={`/faucet/${faucet.address}`}
                                class="view-btn"
                            >
                                查看
                            </a>
                        </div>
                    </div>
                {/each}
            </div>
            {#if queriedBlockRange}
                <p class="block-range-info">{queriedBlockRange}</p>
            {/if}
        {/if}
    </div>

    <!-- Toast 提示 -->
    {#if showToast}
        <div class="toast">
            {toastMessage}
        </div>
    {/if}
</div>

<style>
    .dashboard-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    .create-faucet-section {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
        color: #333;
        margin-bottom: 1.5rem;
    }

    .form-group {
        margin-bottom: 2rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
        color: #555;
    }

    .name-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        box-sizing: border-box;
    }

    .name-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .token-input-row {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
        gap: 0.5rem;
    }

    .token-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        font-family: monospace;
    }

    .token-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .remove-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
    }

    .remove-btn:hover {
        background: #c82333;
    }

    .add-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 0.5rem;
    }

    .add-btn:hover {
        background: #218838;
    }

    .create-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: bold;
        width: 100%;
    }

    .create-btn:hover:not(:disabled) {
        background: #0056b3;
    }

    .create-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .faucet-list-section {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-top: 2rem;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .list-header h2 {
        margin: 0;
    }

    .refresh-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .refresh-btn:hover:not(:disabled) {
        background: #5a6268;
    }

    .empty-message,
    .loading-message {
        text-align: center;
        color: #6c757d;
        padding: 2rem;
        font-size: 1rem;
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
        color: #999;
        font-size: 0.85rem;
        margin-top: 1rem;
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
        padding: 1.5rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f9f9f9;
        transition: box-shadow 0.2s;
    }

    .faucet-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .faucet-info {
        flex: 1;
    }

    .faucet-info h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1.2rem;
    }

    .faucet-address {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.9rem;
        word-break: break-all;
    }

    .address-text {
        font-family: monospace;
        font-size: 0.85rem;
        color: #007bff;
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
        margin-top: 0.75rem;
        color: #999;
        font-size: 0.9rem;
        font-style: italic;
    }

    .token-list {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #ddd;
    }

    .token-list-title {
        margin: 0 0 0.5rem 0;
        color: #555;
        font-size: 0.9rem;
    }

    .token-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
        font-size: 0.85rem;
        color: #666;
    }

    .token-name {
        font-weight: 600;
        color: #333;
        min-width: 80px;
    }

    .token-balance {
        color: #28a745;
        font-family: monospace;
        flex: 1;
    }

    .token-address-short {
        font-family: monospace;
        color: #999;
        font-size: 0.8rem;
    }

    .faucet-actions {
        margin-left: 1rem;
        align-self: center;
    }

    .view-btn {
        display: inline-block;
        background: #007bff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        font-size: 0.9rem;
        transition: background 0.2s;
    }

    .view-btn:hover {
        background: #0056b3;
    }
</style>
