import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { OAuthCredentials, OAuthLoginCallbacks } from "@earendil-works/pi-ai";

const FAR_FUTURE = Date.now() + 1000 * 60 * 60 * 24 * 365 * 10;

function normalizeKey(key: string): string {
  return key.trim();
}

export default function (pi: ExtensionAPI) {
  pi.registerProvider("zai-coding-plan", {
    name: "GLM Coding Plan",
    baseUrl: "https://api.z.ai/api/coding/paas/v4",
    api: "openai-completions",
    compat: {
      supportsDeveloperRole: false,
      thinkingFormat: "zai",
    },
    models: [
      {
        id: "glm-5.1",
        name: "GLM-5.1 (Coding Plan)",
        reasoning: true,
        input: ["text"],
        contextWindow: 204800,
        maxTokens: 131072,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "glm-5-turbo",
        name: "GLM-5-Turbo (Coding Plan)",
        reasoning: true,
        input: ["text"],
        contextWindow: 204800,
        maxTokens: 131072,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        id: "glm-4.7",
        name: "GLM-4.7 (Coding Plan)",
        reasoning: true,
        input: ["text"],
        contextWindow: 204800,
        maxTokens: 131072,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ],
    oauth: {
      name: "GLM Coding Plan API Key",

      async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
        const key = normalizeKey(
          await callbacks.onPrompt({
            message: "Enter your GLM Coding Plan / Z.ai API key:",
          }),
        );

        if (!key) {
          throw new Error("GLM Coding Plan API key is empty");
        }

        return {
          access: key,
          refresh: key,
          expires: FAR_FUTURE,
        };
      },

      async refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
        return {
          access: credentials.access || credentials.refresh,
          refresh: credentials.refresh || credentials.access,
          expires: FAR_FUTURE,
        };
      },

      getApiKey(credentials: OAuthCredentials): string {
        return credentials.access || credentials.refresh;
      },
    },
  });
}
