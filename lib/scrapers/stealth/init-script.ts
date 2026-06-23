import type { BrowserContext } from "playwright";

type StealthInitArgs = {
  locale: string;
  timezoneId: string;
};

/**
 * pw-stealth-enhanced (Python) と同様の3段階パッチを Playwright init script で適用する。
 * @see https://zenn.dev/fukukei23/articles/pw-stealth-enhanced-python-anti-detection
 */
export async function applyStealthInitScripts(
  context: BrowserContext,
  args: StealthInitArgs
): Promise<void> {
  await context.addInitScript({
    content: buildStealthInitScript(args),
  });
}

function buildStealthInitScript({ locale, timezoneId }: StealthInitArgs): string {
  const localeJson = JSON.stringify(locale);
  const timezoneJson = JSON.stringify(timezoneId);

  return `
(() => {
  const locale = ${localeJson};
  const timezoneId = ${timezoneJson};
  const randomNoise = () => Math.floor(Math.random() * 10) - 5;

  try {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
      configurable: true,
    });
  } catch (e) {}

  if (!window.chrome) {
    window.chrome = {
      runtime: {},
      loadTimes: () => ({}),
      csi: () => ({}),
    };
  }

  const languages = [locale, "ja", "en-US", "en"];
  Object.defineProperty(navigator, "language", { get: () => locale, configurable: true });
  Object.defineProperty(navigator, "languages", { get: () => languages, configurable: true });

  const originalPermissionsQuery = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (parameters) => {
    if (parameters.name === "notifications") {
      return Promise.resolve({ state: Notification.permission, onchange: null });
    }
    return originalPermissionsQuery(parameters);
  };

  Object.defineProperty(navigator, "plugins", {
    get: () => {
      const items = [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format", length: 1 },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "", length: 1 },
        { name: "Native Client", filename: "internal-nacl-plugin", description: "", length: 1 },
      ];
      return Object.assign(items, {
        item: (index) => items[index] || null,
        namedItem: (name) => items.find((plugin) => plugin.name === name) || null,
        refresh: () => undefined,
      });
    },
    configurable: true,
  });

  const OriginalDateTimeFormat = Intl.DateTimeFormat;
  const DateTimeFormatProxy = function (locales, options) {
    const resolvedOptions = options && typeof options === "object" ? { ...options } : {};
    if (!resolvedOptions.timeZone) {
      resolvedOptions.timeZone = timezoneId;
    }
    if (locales === undefined) {
      return new OriginalDateTimeFormat(locale, resolvedOptions);
    }
    return new OriginalDateTimeFormat(locales, resolvedOptions);
  };
  DateTimeFormatProxy.prototype = OriginalDateTimeFormat.prototype;
  DateTimeFormatProxy.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf;
  Intl.DateTimeFormat = DateTimeFormatProxy;

  const noisifyCanvas = (canvas) => {
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height) return;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] += randomNoise();
      imageData.data[i + 1] += randomNoise();
      imageData.data[i + 2] += randomNoise();
    }
    context.putImageData(imageData, 0, 0);
  };

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    noisifyCanvas(this);
    return originalToDataURL.apply(this, args);
  };

  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (...args) {
    const imageData = originalGetImageData.apply(this, args);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] += randomNoise();
      imageData.data[i + 1] += randomNoise();
      imageData.data[i + 2] += randomNoise();
    }
    return imageData;
  };

  const UNMASKED_VENDOR_WEBGL = 0x9245;
  const UNMASKED_RENDERER_WEBGL = 0x9246;
  const VENDOR = "Google Inc. (NVIDIA)";
  const RENDERER = "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)";

  const patchWebGlGetParameter = (prototype) => {
    const originalGetParameter = prototype.getParameter;
    prototype.getParameter = function (parameter) {
      if (parameter === UNMASKED_VENDOR_WEBGL) return VENDOR;
      if (parameter === UNMASKED_RENDERER_WEBGL) return RENDERER;
      return originalGetParameter.call(this, parameter);
    };
  };

  try {
    patchWebGlGetParameter(WebGLRenderingContext.prototype);
    patchWebGlGetParameter(WebGL2RenderingContext.prototype);
  } catch (e) {}

  const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
  AnalyserNode.prototype.getFloatFrequencyData = function (array) {
    originalGetFloatFrequencyData.call(this, array);
    for (let i = 0; i < array.length; i++) {
      array[i] += Math.random() * 0.0001 - 0.00005;
    }
  };

  const originalGetByteFrequencyData = AnalyserNode.prototype.getByteFrequencyData;
  AnalyserNode.prototype.getByteFrequencyData = function (array) {
    originalGetByteFrequencyData.call(this, array);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.min(255, Math.max(0, array[i] + Math.floor(Math.random() * 3) - 1));
    }
  };

  if (document.fonts && document.fonts.check) {
    const originalCheck = document.fonts.check.bind(document.fonts);
    document.fonts.check = (font, text) => {
      if (/monospace|sans-serif|serif/i.test(font)) {
        return true;
      }
      return originalCheck(font, text);
    };
  }
})();
`;
}
