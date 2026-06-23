import { chromium, type Browser, type BrowserContext, type LaunchOptions } from "playwright";
import {
  getPlaywrightChannel,
  getStealthConfig,
  isHeadlessEnabled,
  type StealthLaunchOptions,
} from "./config";
import { applyStealthInitScripts } from "./init-script";
import { pickBrowserProfile } from "./profiles";

const STEALTH_LAUNCH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-infobars",
] as const;

function buildLaunchOptions(headless: boolean, channel?: "chrome" | "msedge"): LaunchOptions {
  const args: string[] = [...STEALTH_LAUNCH_ARGS];
  if (!headless) {
    args.push("--start-maximized");
  }

  return {
    headless,
    channel,
    ignoreDefaultArgs: ["--enable-automation"],
    args,
  };
}

export async function launchStealthBrowser(options: StealthLaunchOptions): Promise<Browser> {
  const headless = isHeadlessEnabled(options.headlessDefault);
  const channel = getPlaywrightChannel();
  const launchOptions = buildLaunchOptions(headless, channel);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[playwright] launch headless=${headless} channel=${channel ?? "bundled-chromium"}`
    );
  }

  try {
    return await chromium.launch(launchOptions);
  } catch (error) {
    if (!channel) throw error;

    console.warn(
      `[playwright] channel=${channel} の起動に失敗したため bundled Chromium にフォールバックします`,
      error
    );
    return chromium.launch(buildLaunchOptions(headless));
  }
}

export async function createStealthContext(browser: Browser): Promise<BrowserContext> {
  const config = getStealthConfig();
  const profile = pickBrowserProfile({
    rotateUa: config.rotateUa,
    rotateViewport: config.rotateViewport,
  });

  const context = await browser.newContext({
    userAgent: profile.userAgent,
    viewport: profile.viewport,
    locale: config.locale,
    timezoneId: config.timezoneId,
    colorScheme: "light",
    deviceScaleFactor: 1,
    extraHTTPHeaders: {
      "Accept-Language": `${config.locale},ja;q=0.9,en-US;q=0.8,en;q=0.7`,
    },
  });

  if (config.enabled) {
    await applyStealthInitScripts(context, {
      locale: config.locale,
      timezoneId: config.timezoneId,
    });
  }

  return context;
}
