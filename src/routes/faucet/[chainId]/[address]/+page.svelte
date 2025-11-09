<script lang="ts">
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";
    import {
        readContract,
        writeContract,
        getAccount,
        watchAccount,
    } from "@wagmi/core";
    import { formatUnits, parseUnits } from "viem";
    import EasyFaucetAbi from "$lib/abi/EasyFaucet.json";
    import { wagmiAdapter, appKit } from "$lib/appkit";
    import {
        getCurrentChainConfig,
        isSupportedChain,
        getChainConfig,
        CHAIN_CONFIGS,
        type ChainConfig,
    } from "$lib/contracts";

    interface TokenInfo {
        address: string;
        name: string;
        decimals: number;
        balance: bigint;
    }

    let faucetAddress = "";
    let faucetName = "";
    let tokens: TokenInfo[] = [];
    let isLoading = true;
    let account: any = null;
    let isConnected = false;
    let currentChainId: number | undefined;
    let currentChainConfig: ChainConfig;
    let isUnsupportedChain = false;
    let faucetChainId: number | undefined;
    let faucetChainConfig: ChainConfig | undefined;
    let isWrongChain = false;

    // 领取状态
    let claimingToken: string | null = null;
    let customAmounts: { [key: string]: string } = {};

    // 预设数量
    const presetAmounts = [10, 100, 1000, 10000];

    let unsubscribeAccount: (() => void) | undefined;

    onMount(() => {
        // 获取 URL 参数中的链 ID 和地址
        page.subscribe((p) => {
            const chainIdParam = p.params.chainId;
            faucetAddress = p.params.address || "";

            // 解析链 ID
            if (chainIdParam) {
                faucetChainId = Number(chainIdParam);
                faucetChainConfig = getChainConfig(faucetChainId);

                if (!faucetChainConfig) {
                    console.error(`不支持的链 ID: ${faucetChainId}`);
                }
            }

            if (faucetAddress && faucetChainId) {
                loadFaucetInfo();
            }
        });

        // 获取初始账户信息
        if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
            account = getAccount(wagmiAdapter.wagmiConfig);
            isConnected = account?.isConnected || false;
            currentChainId = account?.chainId;

            // 更新链配置
            updateChainConfig(currentChainId);

            // 监听账户变化
            unsubscribeAccount = watchAccount(wagmiAdapter.wagmiConfig, {
                onChange(newAccount) {
                    const chainChanged = currentChainId !== newAccount?.chainId;
                    account = newAccount;
                    isConnected = newAccount?.isConnected || false;
                    currentChainId = newAccount?.chainId;

                    // 更新链配置
                    updateChainConfig(currentChainId);

                    console.log("账户状态变化:", {
                        isConnected,
                        address: newAccount?.address,
                        chainId: currentChainId,
                        chainName: currentChainConfig.chainName,
                    });

                    // 如果链变化，重新加载 Faucet 信息
                    if (chainChanged && faucetAddress && !isUnsupportedChain) {
                        loadFaucetInfo();
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

                    console.log("AppKit 账户变化:", {
                        isConnected,
                        address: account?.address,
                        chainId: currentChainId,
                    });
                }
            });
        }
    });

    function updateChainConfig(chainId: number | undefined) {
        currentChainConfig = getCurrentChainConfig(chainId);
        isUnsupportedChain = chainId ? !isSupportedChain(chainId) : false;

        // 检查是否在正确的链上
        if (faucetChainId && chainId) {
            isWrongChain = chainId !== faucetChainId;
        } else {
            isWrongChain = false;
        }
    }

    onDestroy(() => {
        // 清理订阅
        if (unsubscribeAccount) {
            unsubscribeAccount();
        }
    });

    async function loadFaucetInfo() {
        if (!faucetAddress || !wagmiAdapter?.wagmiConfig) {
            return;
        }

        try {
            isLoading = true;

            // 更新链状态
            updateChainConfig(currentChainId);

            // 如果在错误的链上，不加载数据
            if (isWrongChain) {
                isLoading = false;
                return;
            }

            // 获取 Faucet 名称
            const name = await readContract(wagmiAdapter.wagmiConfig, {
                address: faucetAddress as `0x${string}`,
                abi: EasyFaucetAbi,
                functionName: "name",
            });
            faucetName = name as string;

            // 获取代币信息
            const result = await readContract(wagmiAdapter.wagmiConfig, {
                address: faucetAddress as `0x${string}`,
                abi: EasyFaucetAbi,
                functionName: "tokenInfos",
            });

            const [addresses, names, decimals, balances] = result as [
                string[],
                string[],
                number[],
                bigint[],
            ];

            tokens = addresses.map((addr, i) => ({
                address: addr,
                name: names[i],
                decimals: decimals[i],
                balance: balances[i],
            }));

            console.log("Faucet 信息加载成功:", { faucetName, tokens });
        } catch (error) {
            console.error("加载 Faucet 信息失败:", error);
            alert("加载 Faucet 信息失败: " + (error as Error).message);
        } finally {
            isLoading = false;
        }
    }

    function formatBalance(balance: bigint, decimals: number): string {
        return formatUnits(balance, decimals);
    }

    function isAmountAvailable(
        amount: number,
        balance: bigint,
        decimals: number,
    ): boolean {
        // 将 amount 转换为 wei 单位再比较
        const amountInWei = parseUnits(amount.toString(), decimals);
        return amountInWei <= balance;
    }

    async function claimTokens(
        tokenAddress: string,
        amount: number,
        decimals: number,
    ) {
        if (!isConnected || !account?.address) {
            alert("请先连接钱包");
            return;
        }

        if (!wagmiAdapter?.wagmiConfig) {
            alert("Wagmi 配置未初始化");
            return;
        }

        try {
            claimingToken = tokenAddress;

            // 将数量转换为 wei
            const amountInWei = parseUnits(amount.toString(), decimals);

            const result = await writeContract(wagmiAdapter.wagmiConfig, {
                address: faucetAddress as `0x${string}`,
                abi: EasyFaucetAbi,
                functionName: "claim",
                args: [tokenAddress, amountInWei, account.address],
            });

            console.log("领取交易已提交:", result);
            alert("代币领取交易已提交，请等待确认");

            // 延迟重新加载余额
            setTimeout(() => {
                loadFaucetInfo();
            }, 3000);
        } catch (error) {
            console.error("领取代币失败:", error);
            alert("领取代币失败: " + (error as Error).message);
        } finally {
            claimingToken = null;
        }
    }

    async function claimCustomAmount(token: TokenInfo) {
        const customAmount = customAmounts[token.address];
        if (!customAmount || parseFloat(customAmount) <= 0) {
            alert("请输入有效的领取数量");
            return;
        }

        const amount = parseFloat(customAmount);
        const amountInWei = parseUnits(customAmount, token.decimals);

        if (amountInWei > token.balance) {
            alert("领取数量超过 Faucet 余额");
            return;
        }

        await claimTokens(token.address, amount, token.decimals);
    }

    function updateCustomAmount(tokenAddress: string, value: string) {
        customAmounts[tokenAddress] = value;
        customAmounts = { ...customAmounts };
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            showToast("地址已复制");
        } catch (error) {
            console.error("复制失败:", error);
        }
    }

    let toastMessage = "";
    let showToastFlag = false;

    function showToast(message: string) {
        toastMessage = message;
        showToastFlag = true;
        setTimeout(() => {
            showToastFlag = false;
        }, 2000);
    }
</script>

<div class="claim-page">
    {#if isLoading}
        <div class="loading-container">
            <div class="spinner"></div>
            <p>加载中...</p>
        </div>
    {:else if isWrongChain && faucetChainConfig}
        <div class="wrong-chain-warning">
            <h2>⚠️ 链不匹配</h2>
            <p>
                此 Faucet 部署在 <strong>{faucetChainConfig.chainName}</strong> 上。
            </p>
            <p>
                您当前连接的是 <strong>{currentChainConfig.chainName}</strong>。
            </p>
            <button
                class="switch-chain-btn"
                onclick={async () => {
                    if (wagmiAdapter?.wagmiConfig) {
                        try {
                            const { switchChain } = await import("@wagmi/core");
                            await switchChain(wagmiAdapter.wagmiConfig, {
                                chainId: faucetChainId!,
                            });
                        } catch (error) {
                            console.error("切换链失败:", error);
                            alert("切换链失败，请在钱包中手动切换");
                        }
                    }
                }}
            >
                切换到 {faucetChainConfig.chainName}
            </button>
        </div>
    {:else if isUnsupportedChain}
        <div class="unsupported-chain-warning">
            <h2>⚠️ 不支持的网络</h2>
            <p>当前连接的网络不被支持。请切换到以下网络之一：</p>
            <ul>
                <li>BSC Testnet</li>
                <li>Ethereum Sepolia</li>
            </ul>
        </div>
    {:else}
        <div class="chain-info-header">
            <span class="chain-badge">
                🌐 {currentChainConfig.chainName}
            </span>
        </div>

        <div class="page-header">
            <h1 class="page-title">{faucetName}</h1>
            <div class="faucet-address">
                <span class="address-label">Faucet 地址:</span>
                <span class="address-text">{faucetAddress}</span>
                <button
                    class="copy-btn"
                    onclick={() => copyToClipboard(faucetAddress)}
                    title="复制地址"
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
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"
                        ></rect>
                        <path
                            d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        ></path>
                    </svg>
                </button>
            </div>
        </div>

        {#if !isConnected}
            <div class="connect-prompt">
                <p>请先连接钱包以领取代币</p>
            </div>
        {/if}

        <div class="tokens-container">
            {#if tokens.length === 0}
                <div class="empty-state">
                    <p>此 Faucet 暂无可领取的代币</p>
                </div>
            {:else}
                {#each tokens as token}
                    <div class="token-card">
                        <div class="token-header">
                            <div class="token-info">
                                <h2 class="token-name">{token.name}</h2>
                                <div class="token-address-row">
                                    <span class="token-address"
                                        >{token.address.slice(
                                            0,
                                            6,
                                        )}...{token.address.slice(-4)}</span
                                    >
                                    <button
                                        class="copy-btn copy-btn-small"
                                        onclick={() =>
                                            copyToClipboard(token.address)}
                                        title="复制代币地址"
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
                            </div>
                            <div class="token-balance">
                                <span class="balance-label">余额:</span>
                                <span class="balance-value"
                                    >{formatBalance(
                                        token.balance,
                                        token.decimals,
                                    )}</span
                                >
                            </div>
                        </div>

                        <div class="claim-section">
                            <h3 class="section-title">选择领取数量</h3>

                            <div class="preset-amounts">
                                {#each presetAmounts as amount}
                                    {@const isAvailable = isAmountAvailable(
                                        amount,
                                        token.balance,
                                        token.decimals,
                                    )}
                                    <button
                                        class="amount-btn"
                                        disabled={!isAvailable ||
                                            !isConnected ||
                                            claimingToken === token.address}
                                        onclick={() =>
                                            claimTokens(
                                                token.address,
                                                amount,
                                                token.decimals,
                                            )}
                                    >
                                        {#if claimingToken === token.address}
                                            <span class="spinner-small"></span>
                                        {:else}
                                            {amount}
                                        {/if}
                                    </button>
                                {/each}
                            </div>

                            <div class="custom-amount">
                                <label for="custom-{token.address}"
                                    >自定义数量:</label
                                >
                                <div class="custom-input-group">
                                    <input
                                        id="custom-{token.address}"
                                        type="number"
                                        placeholder="输入数量"
                                        value={customAmounts[token.address] ||
                                            ""}
                                        oninput={(e) =>
                                            updateCustomAmount(
                                                token.address,
                                                (e.target as HTMLInputElement)
                                                    ?.value || "",
                                            )}
                                        disabled={!isConnected ||
                                            claimingToken === token.address}
                                        min="0"
                                        step="any"
                                    />
                                    <button
                                        class="claim-custom-btn"
                                        onclick={() => claimCustomAmount(token)}
                                        disabled={!isConnected ||
                                            claimingToken === token.address ||
                                            !customAmounts[token.address]}
                                    >
                                        {#if claimingToken === token.address}
                                            领取中...
                                        {:else}
                                            领取
                                        {/if}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    {/if}

    {#if showToastFlag}
        <div class="toast">
            {toastMessage}
        </div>
    {/if}
</div>

<style>
    .claim-page {
        min-height: 100vh;
        background: transparent;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        color: white;
    }

    /* 不支持的链警告 */
    .unsupported-chain-warning {
        background: rgba(255, 193, 7, 0.1);
        border: 2px solid rgba(255, 193, 7, 0.5);
        border-radius: 20px;
        padding: 3rem;
        margin: 2rem auto;
        text-align: center;
        max-width: 600px;
    }

    .unsupported-chain-warning h2 {
        color: #ffc107;
        margin: 0 0 1.5rem 0;
        font-size: 2rem;
    }

    .unsupported-chain-warning p {
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
    }

    .unsupported-chain-warning ul {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0 0 0;
    }

    .unsupported-chain-warning li {
        color: rgba(255, 255, 255, 0.9);
        padding: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
    }

    /* 链不匹配警告 */
    .wrong-chain-warning {
        background: rgba(255, 87, 34, 0.1);
        border: 2px solid rgba(255, 87, 34, 0.5);
        border-radius: 20px;
        padding: 3rem;
        margin: 2rem auto;
        text-align: center;
        max-width: 600px;
    }

    .wrong-chain-warning h2 {
        color: #ff5722;
        margin: 0 0 1.5rem 0;
        font-size: 2rem;
    }

    .wrong-chain-warning p {
        color: rgba(255, 255, 255, 0.9);
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
    }

    .wrong-chain-warning strong {
        color: white;
        font-weight: 700;
    }

    .switch-chain-btn {
        margin-top: 1.5rem;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .switch-chain-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .switch-chain-btn:active {
        transform: translateY(-1px);
    }

    /* 链信息徽章 */
    .chain-info-header {
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

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        color: white;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .page-header {
        text-align: center;
        margin-bottom: 3rem;
        color: white;
    }

    .page-title {
        font-size: 3rem;
        font-weight: 900;
        margin: 0 0 1.5rem 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .faucet-address {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
    }

    .address-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
    }

    .address-text {
        font-family: monospace;
        color: #667eea;
        font-size: 0.95rem;
    }

    .copy-btn {
        background: transparent;
        border: 1px solid transparent;
        cursor: pointer;
        padding: 0.25rem;
        transition: all 0.2s;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #666;
    }

    .copy-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: #667eea;
    }

    .copy-btn-small {
        padding: 0.15rem;
    }

    .connect-prompt {
        text-align: center;
        padding: 2rem;
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 12px;
        margin-bottom: 2rem;
        color: #ffc107;
    }

    .tokens-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.1rem;
    }

    .token-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2rem;
        transition: all 0.3s ease;
    }

    .token-card:hover {
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .token-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .token-info {
        flex: 1;
    }

    .token-name {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        margin: 0 0 0.5rem 0;
    }

    .token-address-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .token-address {
        font-family: monospace;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
    }

    .token-balance {
        text-align: right;
    }

    .balance-label {
        display: block;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .balance-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #28a745;
        font-family: monospace;
    }

    .claim-section {
        color: white;
    }

    .section-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
        color: rgba(255, 255, 255, 0.9);
    }

    .preset-amounts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .amount-btn {
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .amount-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .amount-btn:active:not(:disabled) {
        transform: translateY(-1px);
    }

    .amount-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .spinner-small {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    .custom-amount {
        margin-top: 1.5rem;
    }

    .custom-amount label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
    }

    .custom-input-group {
        display: flex;
        gap: 1rem;
    }

    .custom-input-group input {
        flex: 1;
        padding: 0.875rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .custom-input-group input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    .custom-input-group input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .claim-custom-btn {
        padding: 0.875rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .claim-custom-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    .claim-custom-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
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

    /* Responsive */
    @media (max-width: 768px) {
        .claim-page {
            padding: 1rem;
        }

        .page-title {
            font-size: 2rem;
        }

        .faucet-address {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
        }

        .token-header {
            flex-direction: column;
            gap: 1rem;
        }

        .token-balance {
            text-align: left;
        }

        .preset-amounts {
            grid-template-columns: repeat(2, 1fr);
        }

        .custom-input-group {
            flex-direction: column;
        }

        .claim-custom-btn {
            width: 100%;
        }
    }
</style>
