<script lang="ts">
    import "$lib/appkit";
    import "../styles/global.css";
    import favicon from "$lib/assets/favicon.svg";

    let { children } = $props();
    let isMenuOpen = $state(false);

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    function closeMenu() {
        isMenuOpen = false;
    }
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="app-container">
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
                <a href="/" class="nav-link">首页</a>
                <a href="/dashboard" class="nav-link">Dashboard</a>
            </div>

            <!-- Wallet Button & Mobile Menu Toggle -->
            <div class="nav-actions">
                <div class="wallet-button">
                    <appkit-button></appkit-button>
                </div>
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
                <a href="/" class="mobile-link" onclick={closeMenu}>首页</a>
                <a href="/dashboard" class="mobile-link" onclick={closeMenu}
                    >Dashboard</a
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
                © 2024 Easy Faucet. Built with ❤️ for Web3 Community
            </p>
        </div>
    </footer>
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
        display: flex;
        align-items: center;
    }

    /* Style the appkit-button - 全局样式覆盖 */
    :global(appkit-button) {
        /* 覆盖默认颜色变量 */
        --w3m-accent: #667eea !important;
        --w3m-color-mix: #764ba2 !important;
        --w3m-color-mix-strength: 50% !important;
    }

    /* 覆盖所有 Reown/WalletConnect 按钮样式 */
    :global(w3m-button),
    :global(w3m-connect-button),
    :global(w3m-account-button),
    :global(w3m-network-button),
    :global(appkit-button button),
    :global(appkit-button > button),
    :global(appkit-button [role="button"]) {
        background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 100%
        ) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 12px !important;
        color: white !important;
        font-weight: 600 !important;
        padding: 0.65rem 1.25rem !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
        font-size: 0.9rem !important;
        cursor: pointer !important;
    }

    :global(w3m-button:hover),
    :global(w3m-connect-button:hover),
    :global(w3m-account-button:hover),
    :global(w3m-network-button:hover),
    :global(appkit-button button:hover),
    :global(appkit-button > button:hover),
    :global(appkit-button [role="button"]:hover) {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
        background: linear-gradient(
            135deg,
            #764ba2 0%,
            #667eea 100%
        ) !important;
    }

    /* 覆盖按钮内部文本和图标颜色 */
    :global(appkit-button *),
    :global(w3m-button *),
    :global(w3m-connect-button *),
    :global(w3m-account-button *) {
        color: white !important;
    }

    /* 移除默认的蓝色背景 */
    :global(appkit-button),
    :global(appkit-button *[style*="background"]) {
        background: transparent !important;
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
