<script lang="ts">
    import { onMount } from "svelte";

    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    const features = [
        {
            icon: "💧",
            title: "创建 Faucet",
            description: "轻松创建您自己的代币水龙头，无需编写代码",
        },
        {
            icon: "🪙",
            title: "多币种支持",
            description: "支持添加任意 ERC20 代币，灵活管理您的资产",
        },
        {
            icon: "⚡",
            title: "快速领取",
            description: "用户可以快速便捷地领取测试代币",
        },
        {
            icon: "🔒",
            title: "安全可靠",
            description: "基于智能合约，透明且安全的代币分发机制",
        },
    ];

    const stats = [
        { value: "1000+", label: "Faucets 创建" },
        { value: "50K+", label: "代币分发" },
        { value: "10K+", label: "活跃用户" },
    ];
</script>

<svelte:head>
    <title>Easy Faucet - Web3 代币水龙头平台</title>
    <meta
        name="description"
        content="创建和管理您自己的 Web3 代币水龙头，支持 ERC20 代币"
    />
</svelte:head>

<div class="page-container">
    <!-- Hero Section -->
    <section class="hero" class:mounted>
        <div class="hero-background">
            <div class="gradient-orb orb-1"></div>
            <div class="gradient-orb orb-2"></div>
            <div class="gradient-orb orb-3"></div>
        </div>

        <div class="hero-content">
            <div class="hero-badge">
                <span class="badge-icon">✨</span>
                <span>Web3 代币水龙头平台</span>
            </div>

            <h1 class="hero-title">
                <span class="gradient-text">Easy Faucet</span>
            </h1>

            <p class="hero-subtitle">
                创建属于您自己的代币水龙头<br />
                让 Web3 测试代币分发变得简单高效
            </p>

            <div class="hero-buttons">
                <a href="/dashboard" class="btn btn-primary">
                    <span>开始创建</span>
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
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
                <a href="#features" class="btn btn-secondary">
                    <span>了解更多</span>
                </a>
            </div>

            <!-- Stats -->
            <div class="stats">
                {#each stats as stat}
                    <div class="stat-item">
                        <div class="stat-value">{stat.value}</div>
                        <div class="stat-label">{stat.label}</div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Floating Elements -->
        <div class="floating-elements">
            <div class="float-item float-1">💧</div>
            <div class="float-item float-2">🪙</div>
            <div class="float-item float-3">⚡</div>
            <div class="float-item float-4">🔷</div>
            <div class="float-item float-5">💎</div>
            <div class="float-item float-6">🌟</div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
        <div class="section-header">
            <h2 class="section-title">强大功能</h2>
            <p class="section-subtitle">
                一站式解决方案，让代币分发变得轻而易举
            </p>
        </div>

        <div class="features-grid">
            {#each features as feature, i}
                <div class="feature-card" style="animation-delay: {i * 0.1}s">
                    <div class="feature-icon">{feature.icon}</div>
                    <h3 class="feature-title">{feature.title}</h3>
                    <p class="feature-description">{feature.description}</p>
                </div>
            {/each}
        </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works">
        <div class="section-header">
            <h2 class="section-title">如何使用</h2>
            <p class="section-subtitle">三步轻松创建您的代币水龙头</p>
        </div>

        <div class="steps">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h3>连接钱包</h3>
                    <p>使用您的 Web3 钱包连接到平台</p>
                </div>
            </div>

            <div class="step-line"></div>

            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h3>创建 Faucet</h3>
                    <p>输入名称并添加您想要分发的 ERC20 代币</p>
                </div>
            </div>

            <div class="step-line"></div>

            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h3>开始分发</h3>
                    <p>分享您的 Faucet 链接，让用户轻松领取代币</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
        <div class="cta-content">
            <h2 class="cta-title">准备好了吗？</h2>
            <p class="cta-subtitle">立即开始创建您的第一个代币水龙头</p>
            <a href="/dashboard" class="btn btn-cta">
                <span>立即开始</span>
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
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
            </a>
        </div>
    </section>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    .page-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
        color: white;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
    }

    /* Hero Section */
    .hero {
        position: relative;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow: hidden;
    }

    .hero-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
    }

    .gradient-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.5;
        animation: float 20s ease-in-out infinite;
    }

    .orb-1 {
        width: 500px;
        height: 500px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        top: -10%;
        left: -10%;
        animation-delay: 0s;
    }

    .orb-2 {
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        top: 30%;
        right: -5%;
        animation-delay: -7s;
    }

    .orb-3 {
        width: 600px;
        height: 600px;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        bottom: -20%;
        left: 20%;
        animation-delay: -14s;
    }

    @keyframes float {
        0%,
        100% {
            transform: translate(0, 0) scale(1);
        }
        33% {
            transform: translate(30px, -30px) scale(1.1);
        }
        66% {
            transform: translate(-20px, 20px) scale(0.9);
        }
    }

    .hero-content {
        position: relative;
        z-index: 1;
        text-align: center;
        max-width: 900px;
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 1s ease-out forwards;
    }

    .hero.mounted .hero-content {
        animation: fadeInUp 1s ease-out forwards;
    }

    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50px;
        margin-bottom: 2rem;
        font-size: 0.9rem;
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
    }

    .badge-icon {
        font-size: 1.2rem;
        animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .hero-title {
        font-size: clamp(3rem, 8vw, 6rem);
        font-weight: 900;
        margin: 0 0 1.5rem 0;
        line-height: 1.1;
        letter-spacing: -0.02em;
    }

    .gradient-text {
        background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 25%,
            #f093fb 50%,
            #4facfe 75%,
            #00f2fe 100%
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradientShift 3s ease infinite;
    }

    @keyframes gradientShift {
        0%,
        100% {
            background-position: 0% center;
        }
        50% {
            background-position: 100% center;
        }
    }

    .hero-subtitle {
        font-size: clamp(1.1rem, 3vw, 1.5rem);
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 3rem 0;
        line-height: 1.6;
    }

    .hero-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 4rem;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-size: 1.1rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
        cursor: pointer;
        border: none;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.2);
        color: white;
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-3px);
    }

    .btn svg {
        transition: transform 0.3s ease;
    }

    .btn:hover svg {
        transform: translateX(5px);
    }

    /* Stats */
    .stats {
        display: flex;
        gap: 3rem;
        justify-content: center;
        flex-wrap: wrap;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-item {
        text-align: center;
    }

    .stat-value {
        font-size: 2.5rem;
        font-weight: 900;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
    }

    .stat-label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
    }

    /* Floating Elements */
    .floating-elements {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        overflow: hidden;
    }

    .float-item {
        position: absolute;
        font-size: 3rem;
        opacity: 0.3;
        animation: floatRandom 15s ease-in-out infinite;
    }

    .float-1 {
        top: 10%;
        left: 10%;
        animation-delay: 0s;
    }
    .float-2 {
        top: 20%;
        right: 15%;
        animation-delay: -3s;
    }
    .float-3 {
        bottom: 20%;
        left: 15%;
        animation-delay: -6s;
    }
    .float-4 {
        top: 60%;
        right: 10%;
        animation-delay: -9s;
    }
    .float-5 {
        bottom: 30%;
        right: 25%;
        animation-delay: -12s;
    }
    .float-6 {
        top: 40%;
        left: 5%;
        animation-delay: -15s;
    }

    @keyframes floatRandom {
        0%,
        100% {
            transform: translate(0, 0) rotate(0deg);
        }
        25% {
            transform: translate(20px, -20px) rotate(90deg);
        }
        50% {
            transform: translate(-15px, -40px) rotate(180deg);
        }
        75% {
            transform: translate(-30px, -10px) rotate(270deg);
        }
    }

    /* Features Section */
    .features {
        padding: 8rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .section-header {
        text-align: center;
        margin-bottom: 4rem;
    }

    .section-title {
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 900;
        margin: 0 0 1rem 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .section-subtitle {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .feature-card {
        padding: 2.5rem;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        transition: all 0.3s ease;
        animation: fadeInUp 0.8s ease-out forwards;
        opacity: 0;
    }

    .feature-card:hover {
        transform: translateY(-10px);
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .feature-icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-10px);
        }
    }

    .feature-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
    }

    .feature-description {
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.6;
        margin: 0;
    }

    /* How It Works Section */
    .how-it-works {
        padding: 8rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .steps {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        margin-top: 4rem;
    }

    .step {
        flex: 1;
        min-width: 250px;
        max-width: 300px;
        text-align: center;
        animation: fadeInUp 0.8s ease-out forwards;
        opacity: 0;
    }

    .step:nth-child(1) {
        animation-delay: 0.2s;
    }
    .step:nth-child(3) {
        animation-delay: 0.4s;
    }
    .step:nth-child(5) {
        animation-delay: 0.6s;
    }

    .step-number {
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 900;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        animation: pulse 2s ease-in-out infinite;
    }

    .step-content h3 {
        font-size: 1.5rem;
        margin: 0 0 0.5rem 0;
    }

    .step-content p {
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
        line-height: 1.6;
    }

    .step-line {
        width: 80px;
        height: 2px;
        background: linear-gradient(
            90deg,
            rgba(102, 126, 234, 0.5),
            rgba(118, 75, 162, 0.5)
        );
        flex-shrink: 0;
    }

    @media (max-width: 768px) {
        .step-line {
            display: none;
        }
    }

    /* CTA Section */
    .cta {
        padding: 8rem 2rem;
        text-align: center;
    }

    .cta-content {
        max-width: 800px;
        margin: 0 auto;
        padding: 4rem 2rem;
        background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.2) 0%,
            rgba(118, 75, 162, 0.2) 100%
        );
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 30px;
    }

    .cta-title {
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 900;
        margin: 0 0 1rem 0;
    }

    .cta-subtitle {
        font-size: 1.3rem;
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 2rem 0;
    }

    .btn-cta {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        padding: 1.2rem 3rem;
        font-size: 1.2rem;
    }

    .btn-cta:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 50px rgba(102, 126, 234, 0.6);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .hero {
            min-height: 90vh;
            padding: 1rem;
        }

        .stats {
            gap: 2rem;
            padding: 1.5rem;
        }

        .stat-value {
            font-size: 2rem;
        }

        .features,
        .how-it-works,
        .cta {
            padding: 4rem 1rem;
        }

        .features-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
