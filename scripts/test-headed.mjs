import { launchStealthBrowser } from "../lib/scrapers/stealth/browser.ts";

console.log("PLAYWRIGHT_HEADLESS =", JSON.stringify(process.env.PLAYWRIGHT_HEADLESS));

const browser = await launchStealthBrowser({ headlessDefault: true });
console.log("browser launched, waiting 5s...");
await new Promise((r) => setTimeout(r, 5000));
await browser.close();
console.log("done");
