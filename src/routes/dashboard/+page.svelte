<script lang="ts">
    import { writeContract, getAccount } from "@wagmi/core";
    import { onMount } from "svelte";
    import EasyFaucetFactoryAbi from "$lib/abi/EasyFaucetFactory.json";
    import {
        EasyFaucetFactoryAddress,
        EasyFaucetBeaconAddress,
    } from "$lib/contracts";
    import { appKit, wagmiAdapter } from "$lib/appkit";

    let faucetName: string = "";
    let tokenAddresses: string[] = [""];
    let isCreating = false;
    let account: any = null;
    let isConnected = false;

    onMount(() => {
        // 获取初始账户状态
        if (wagmiAdapter && wagmiAdapter.wagmiConfig) {
            account = getAccount(wagmiAdapter.wagmiConfig);
            isConnected = account?.isConnected || false;
        }

        // 监听 AppKit 状态变化
        if (appKit) {
            appKit.subscribeAccount((newAccount) => {
                account = newAccount;
                isConnected = newAccount?.isConnected || false;
            });
        }
    });

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
</style>
