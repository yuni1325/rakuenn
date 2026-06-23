export type StealthConfig = {
  enabled: boolean;
  locale: string;
  timezoneId: string;
  rotateUa: boolean;
  rotateViewport: boolean;
};

export type StealthLaunchOptions = {
  /** PLAYWRIGHT_HEADLESS 未設定時の既定値 */
  headlessDefault: boolean;
};

export function isStealthEnabled(): boolean {
  return process.env.PLAYWRIGHT_STEALTH !== "false";
}

function normalizeEnvValue(value: string): string {
  return value.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

function parseHeadlessEnv(defaultValue: boolean): boolean {
  const raw = process.env.PLAYWRIGHT_HEADLESS;
  if (raw === undefined || raw.trim() === "") {
    return defaultValue;
  }

  const normalized = normalizeEnvValue(raw);
  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  return defaultValue;
}

export function isHeadlessEnabled(defaultValue: boolean): boolean {
  return parseHeadlessEnv(defaultValue);
}

export function getStealthConfig(): StealthConfig {
  return {
    enabled: isStealthEnabled(),
    locale: process.env.PLAYWRIGHT_LOCALE ?? "ja-JP",
    timezoneId: process.env.PLAYWRIGHT_TIMEZONE_ID ?? "Asia/Tokyo",
    rotateUa: process.env.PLAYWRIGHT_ROTATE_UA === "true",
    rotateViewport: process.env.PLAYWRIGHT_ROTATE_VIEWPORT === "true",
  };
}

export function getPlaywrightChannel(): "chrome" | "msedge" | undefined {
  const channel = process.env.PLAYWRIGHT_CHANNEL?.trim();
  if (channel === "chrome" || channel === "msedge") {
    return channel;
  }

  return undefined;
}
