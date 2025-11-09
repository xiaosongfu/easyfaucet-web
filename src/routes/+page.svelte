<script lang="ts">
    import { onMount } from "svelte";
    import { _ } from "svelte-i18n";

    let mounted = false;

    onMount(() => {
        mounted = true;
    });
</script>

<svelte:head>
    <title>Easy Faucet - {$_("home.badge")}</title>
    <meta name="description" content={$_("home.subtitle")} />
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
                <span>{$_("home.badge")}</span>
            </div>

            <h1 class="hero-title">
                <span class="gradient-text">Easy Faucet</span>
            </h1>
            <h1 class="hero-title">{$_("home.title")}</h1>

            <p class="hero-subtitle">
                {@html $_("home.subtitle").replace("\n", "<br />")}
            </p>

            <div class="hero-buttons">
                <a href="/dashboard" class="btn btn-primary">
                    <span>{$_("home.getStarted")}</span>
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
                    <span>{$_("home.learnMore")}</span>
                </a>
            </div>

            <!-- Stats -->
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value">1000+</div>
                    <div class="stat-label">
                        {$_("home.stats.faucetsCreated")}
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">50K+</div>
                    <div class="stat-label">
                        {$_("home.stats.tokensDistributed")}
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">10K+</div>
                    <div class="stat-label">{$_("home.stats.activeUsers")}</div>
                </div>
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
            <h2 class="section-title">{$_("home.features.title")}</h2>
            <p class="section-subtitle">
                {$_("home.features.subtitle")}
            </p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">💧</div>
                <h3 class="feature-title">
                    {$_("home.features.createFaucet.title")}
                </h3>
                <p class="feature-description">
                    {$_("home.features.createFaucet.description")}
                </p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🪙</div>
                <h3 class="feature-title">
                    {$_("home.features.multiToken.title")}
                </h3>
                <p class="feature-description">
                    {$_("home.features.multiToken.description")}
                </p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3 class="feature-title">
                    {$_("home.features.quickClaim.title")}
                </h3>
                <p class="feature-description">
                    {$_("home.features.quickClaim.description")}
                </p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔒</div>
                <h3 class="feature-title">
                    {$_("home.features.secure.title")}
                </h3>
                <p class="feature-description">
                    {$_("home.features.secure.description")}
                </p>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works">
        <div class="section-header">
            <h2 class="section-title">{$_("home.howItWorks.title")}</h2>
            <p class="section-subtitle">{$_("home.howItWorks.subtitle")}</p>
        </div>

        <div class="steps">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                    <h3>{$_("home.howItWorks.step1.title")}</h3>
                    <p>{$_("home.howItWorks.step1.description")}</p>
                </div>
            </div>

            <div class="step-line"></div>

            <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                    <h3>{$_("home.howItWorks.step2.title")}</h3>
                    <p>{$_("home.howItWorks.step2.description")}</p>
                </div>
            </div>

            <div class="step-line"></div>

            <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                    <h3>{$_("home.howItWorks.step3.title")}</h3>
                    <p>{$_("home.howItWorks.step3.description")}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
        <div class="cta-content">
            <h2 class="cta-title">{$_("home.cta.title")}</h2>
            <p class="cta-subtitle">{$_("home.cta.subtitle")}</p>
            <a href="/dashboard" class="btn btn-cta">
                <span>{$_("home.cta.button")}</span>
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
    .page-container {
        min-height: 100vh;
        background: transparent;
        color: white;
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
        margin: 0;
        padding: 0;
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
        margin: 0;
        background: transparent;
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
        background: transparent;
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
        background: transparent;
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
        background: transparent;
        margin: 0;
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
