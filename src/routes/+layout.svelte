<script lang="ts">
    import "$lib/appkit";
    import "../styles/global.css";
    import favicon from "$lib/assets/favicon.svg";
    import { onMount } from "svelte";
    import { appKit } from "$lib/appkit";
    import { _ } from "svelte-i18n";
    import { switchLocale, locale, isLoading } from "$lib/i18n";

    let { children } = $props();
    let isMenuOpen = $state(false);
    let isConnected = $state(false);
    let address = $state("");
    let currentLocale = $state("zh");
    let i18nReady = $state(false);

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    function closeMenu() {
        isMenuOpen = false;
    }

    function formatAddress(addr: string) {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }

    async function connectWallet() {
        if (appKit) {
            await appKit.open();
        }
    }

    function toggleLocale() {
        const newLocale = currentLocale === "zh" ? "en" : "zh";
        switchLocale(newLocale);
        currentLocale = newLocale;
    }

    onMount(() => {
        // 订阅 i18n loading 状态
        const unsubscribeLoading = isLoading.subscribe((loading) => {
            i18nReady = !loading;
        });

        // 订阅 locale 变化
        const unsubscribe = locale.subscribe((value) => {
            if (value) {
                currentLocale = value;
            }
        });

        // 监听钱包连接状态
        if (appKit) {
            appKit.subscribeAccount((account) => {
                isConnected = account?.isConnected || false;
                address = account?.address || "";
            });
        }

        return () => {
            unsubscribeLoading();
            unsubscribe();
        };
    });
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
    {#if i18nReady}
        <!-- Navigation Bar -->
        <nav class="navbar">
            <div class="nav-content">
                <!-- Logo -->
                <a href="/" class="logo" onclick={closeMenu}>
                    <span class="logo-icon">💧</span>
                    <span class="logo-text">Easy Faucet</span>
                </a>

                <!-- Desktop Navigation -->
                <div class="nav-links">
                    <a href="/" class="nav-link">{$_("nav.home")}</a>
                    <a href="/dashboard" class="nav-link"
                        >{$_("nav.dashboard")}</a
                    >
                </div>

                <!-- Wallet Button & Mobile Menu Toggle -->
                <div class="nav-actions">
                    <!-- Language Switcher -->
                    <button
                        class="lang-switcher"
                        onclick={toggleLocale}
                        title="Switch Language"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path
                                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                            ></path>
                        </svg>
                        <span>{currentLocale === "zh" ? "EN" : "中文"}</span>
                    </button>

                    <button class="wallet-button" onclick={connectWallet}>
                        {#if isConnected && address}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <rect
                                    x="1"
                                    y="4"
                                    width="22"
                                    height="16"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <span>{formatAddress(address)}</span>
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <rect
                                    x="1"
                                    y="4"
                                    width="22"
                                    height="16"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                            </svg>
                            <span>{$_("nav.connectWallet")}</span>
                        {/if}
                    </button>
                    <button
                        class="menu-toggle"
                        onclick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {#if isMenuOpen}
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
                        {:else}
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
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Mobile Menu -->
            {#if isMenuOpen}
                <div class="mobile-menu">
                    <a href="/" class="mobile-link" onclick={closeMenu}
                        >{$_("nav.home")}</a
                    >
                    <a href="/dashboard" class="mobile-link" onclick={closeMenu}
                        >{$_("nav.dashboard")}</a
                    >
                </div>
            {/if}
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            {@render children()}
        </main>

        <!-- Footer -->
        <footer class="footer">
            <div class="footer-content">
                <p class="footer-text">
                    {$_("footer.copyright")}
                </p>
            </div>
        </footer>
    {:else}
        <!-- Loading i18n -->
        <div
            style="display: flex; align-items: center; justify-content: center; min-height: 100vh; color: white;"
        >
            Loading...
        </div>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        overflow-x: hidden;
    }

    :global(html) {
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
    }

    .app-container {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: transparent;
    }

    /* Navigation Bar */
    .navbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: rgba(15, 15, 30, 0.95);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin: 0;
        padding: 0;
    }

    .nav-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
    }

    /* Logo */
    .logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        color: white;
        font-size: 1.5rem;
        font-weight: 900;
        transition: transform 0.2s;
    }

    .logo:hover {
        transform: scale(1.05);
    }

    .logo-icon {
        font-size: 2rem;
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-5px);
        }
    }

    .logo-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Navigation Links */
    .nav-links {
        display: flex;
        align-items: center;
        gap: 2rem;
        flex: 1;
        justify-content: center;
    }

    .nav-link {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        font-weight: 500;
        font-size: 1rem;
        transition: all 0.2s;
        position: relative;
        padding: 0.5rem 0;
    }

    .nav-link::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        transition: width 0.3s ease;
    }

    .nav-link:hover {
        color: white;
    }

    .nav-link:hover::after {
        width: 100%;
    }

    /* Navigation Actions */
    .nav-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .wallet-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        padding: 0.7rem 1.5rem;
        color: white;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        position: relative;
        overflow: hidden;
    }

    .wallet-button::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        transition: left 0.6s ease;
    }

    .wallet-button:hover {
        transform: translateY(-2px) scale(1.02);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .wallet-button:hover::before {
        left: 100%;
    }

    .wallet-button:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
    }

    .wallet-button svg {
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }

    .wallet-button span {
        font-weight: 600;
        letter-spacing: 0.02em;
    }

    .lang-switcher {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 0.6rem 1rem;
        color: white;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }

    .lang-switcher:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }

    .lang-switcher:active {
        transform: translateY(0);
    }

    .lang-switcher svg {
        flex-shrink: 0;
    }

    .lang-switcher span {
        font-weight: 600;
        font-size: 0.8rem;
    }

    .menu-toggle {
        display: none;
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.5rem;
        transition: color 0.2s;
    }

    .menu-toggle:hover {
        color: #667eea;
    }

    /* Mobile Menu */
    .mobile-menu {
        display: none;
        flex-direction: column;
        padding: 1rem 2rem;
        gap: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .mobile-link {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        transition: all 0.2s;
        font-weight: 500;
    }

    .mobile-link:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }

    /* Main Content */
    .main-content {
        flex: 1;
        margin-top: 80px; /* Height of navbar */
        background: transparent;
        padding: 0;
        margin-bottom: 0;
    }

    /* Footer */
    .footer {
        background: rgba(15, 15, 30, 0.95);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2rem;
        text-align: center;
        margin: 0;
    }

    .footer-content {
        max-width: 1400px;
        margin: 0 auto;
    }

    .footer-text {
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
        font-size: 0.9rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .nav-content {
            padding: 1rem;
        }

        .nav-links {
            display: none;
        }

        .menu-toggle {
            display: block;
        }

        .mobile-menu {
            display: flex;
        }

        .main-content {
            margin-top: 70px;
        }

        .logo-text {
            font-size: 1.2rem;
        }

        .wallet-button {
            padding: 0.6rem 1.2rem;
            font-size: 0.85rem;
            border-radius: 14px;
        }

        .lang-switcher {
            padding: 0.5rem 0.8rem;
            font-size: 0.8rem;
        }

        .lang-switcher span {
            font-size: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .nav-content {
            padding: 0.75rem;
        }

        .logo {
            font-size: 1.25rem;
        }

        .logo-icon {
            font-size: 1.75rem;
        }
    }
</style>
