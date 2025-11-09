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
        timestamp: number;
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
            // 解析事件数据并获取时间戳
            const logsWithTimestamp = await Promise.all(
                allLogs.map(async (log) => {
                    try {
                        const block = await publicClient.getBlock({
                            blockNumber: log.blockNumber,
                        });
                        return {
                            owner: log.args.owner as string,
                            name: log.args.name as string,
                            address: log.args.faucet as string,
                            blockNumber: log.blockNumber,
                            timestamp: Number(block.timestamp),
                            tokens: [],
                            isLoadingTokens: false,
                        };
                    } catch (error) {
                        console.error(
                            `获取区块 ${log.blockNumber} 时间戳失败:`,
                            error,
                        );
                        return {
                            owner: log.args.owner as string,
                            name: log.args.name as string,
                            address: log.args.faucet as string,
                            blockNumber: log.blockNumber,
                            timestamp: 0,
                            tokens: [],
                            isLoadingTokens: false,
                        };
                    }
                }),
            );

            userFaucets = logsWithTimestamp;

            // 按时间戳降序排序（最新的在前）
            userFaucets.sort((a, b) => b.timestamp - a.timestamp);

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

    function formatDate(timestamp: number): string {
        if (!timestamp) return "未知";
        const date = new Date(timestamp * 1000);
        return date.toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatRelativeTime(timestamp: number): string {
        if (!timestamp) return "未知";
        const now = Date.now();
        const diff = now - timestamp * 1000;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} 天前`;
        if (hours > 0) return `${hours} 小时前`;
        if (minutes > 0) return `${minutes} 分钟前`;
        return "刚刚";
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
            alert("请输入代币地址");
            return;
        }

        // 验证地址格式
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!addressRegex.test(addTokenAddress)) {
            alert("无效的地址格式");
            return;
        }

        if (!account?.address) {
            alert("请先连接钱包");
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
            showToastMessage("代币添加交易已提交，请等待确认");

            // 关闭弹窗
            closeAddTokenModal();

            // 延迟重新加载列表
            setTimeout(() => {
                loadUserFaucets();
            }, 3000);
        } catch (error) {
            console.error("添加代币失败:", error);
            alert("添加代币失败: " + (error as Error).message);
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
                            onclick={() => removeTokenInput(index)}
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
                onclick={addTokenInput}
                class="add-btn"
                disabled={isCreating}
            >
                + 添加代币地址
            </button>
        </div>

        <button
            class="create-btn"
            onclick={newFaucet}
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
                    onclick={loadUserFaucets}
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
                                <span class="address-label">地址:</span>
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
                                <span class="time-label">创建时间:</span>
                                <span
                                    class="time-text"
                                    title={formatDate(faucet.timestamp)}
                                >
                                    {formatRelativeTime(faucet.timestamp)}
                                </span>
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
                                <p class="no-tokens">暂无代币</p>
                            {/if}
                        </div>
                        <div class="faucet-actions">
                            <button
                                class="add-token-btn"
                                onclick={() =>
                                    openAddTokenModal(faucet.address)}
                                title="添加代币"
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
                                添加代币
                            </button>
                            <a
                                href={`/faucet/${faucet.address}`}
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
                    <h2 id="modal-title">添加代币</h2>
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
                        <label for="token-address">ERC20 代币地址:</label>
                        <input
                            id="token-address"
                            type="text"
                            placeholder="0x..."
                            bind:value={addTokenAddress}
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
                        取消
                    </button>
                    <button
                        class="modal-btn modal-btn-confirm"
                        onclick={addToken}
                        disabled={isAddingToken}
                    >
                        {isAddingToken ? "添加中..." : "确认添加"}
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
