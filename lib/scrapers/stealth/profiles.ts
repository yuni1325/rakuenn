export type BrowserProfile = {
  userAgent: string;
  viewport: { width: number; height: number };
};

const USER_AGENT_POOL: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
];

const VIEWPORT_POOL: { width: number; height: number }[] = [
  { width: 1920, height: 1080 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
];

const DEFAULT_PROFILE: BrowserProfile = {
  userAgent: USER_AGENT_POOL[0],
  viewport: VIEWPORT_POOL[0],
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickBrowserProfile(options: {
  rotateUa: boolean;
  rotateViewport: boolean;
}): BrowserProfile {
  return {
    userAgent: options.rotateUa ? pickRandom(USER_AGENT_POOL) : DEFAULT_PROFILE.userAgent,
    viewport: options.rotateViewport ? pickRandom(VIEWPORT_POOL) : DEFAULT_PROFILE.viewport,
  };
}
