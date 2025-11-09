// i18n 配置
import {
  register,
  init,
  getLocaleFromNavigator,
  locale,
  isLoading,
} from "svelte-i18n";
import { browser } from "$app/environment";

// 注册语言包
register("en", () => import("./locales/en.json"));
register("zh", () => import("./locales/zh.json"));

// 获取初始语言
function getInitialLocale(): string {
  if (browser) {
    // 从 localStorage 获取保存的语言设置
    const savedLocale = localStorage.getItem("locale");
    if (savedLocale) {
      return savedLocale;
    }

    // 从浏览器语言检测
    const browserLocale = getLocaleFromNavigator();
    if (browserLocale) {
      return browserLocale.startsWith("zh") ? "zh" : "en";
    }
  }

  // 默认英文
  return "en";
}

// 初始化 i18n
init({
  fallbackLocale: "en",
  initialLocale: getInitialLocale(),
  loadingDelay: 0,
});

// 切换语言
export function switchLocale(newLocale: string) {
  if (browser) {
    localStorage.setItem("locale", newLocale);
  }
  locale.set(newLocale);
}

// 导出 locale store 和 loading 状态
export { locale, isLoading };
