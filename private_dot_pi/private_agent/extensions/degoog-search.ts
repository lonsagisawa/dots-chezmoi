/**
 * Degoog Web Search Extension
 * 
 * セルフホスト型メタサーチエンジンDegoogを使ってWeb検索を行う拡張機能
 * 
 * 設定方法（2つのオプション）:
 * 
 * オプション1: 環境変数
 *   export DEGOOG_URL='https://your-degoog-instance.com'
 *   export DEGOOG_API_KEY='your-api-key'  # オプション
 * 
 * オプション2: ~/.pi/agent/settings.json に追加
 *   {
 *     "degoog": {
 *       "url": "https://your-degoog-instance.com",
 *       "apiKey": "your-api-key"  // オプション
 *     }
 *   }
 */

import { StringEnum, Type } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Degoog APIレスポンスの型定義
interface DegoogSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  score: number;
  sources: string[];
  insecure?: boolean;
  isGif?: boolean;
  content?: string;
  thumbnail?: string;
}

interface DegoogEngineTiming {
  name: string;
  time: number;
  resultCount: number;
  status: string;
  errorReason?: string;
  httpStatus?: number;
}

interface DegoogSearchResponse {
  results: DegoogSearchResult[];
  query: string;
  totalTime: number;
  type: string;
  engineTimings: DegoogEngineTiming[];
  relatedSearches?: string[];
}

// 設定の型定義
interface DegoogConfig {
  url: string;
  apiKey?: string;
}

/**
 * settings.jsonからdegoog設定を読み込む
 */
function loadConfigFromSettings(): Partial<DegoogConfig> {
  const settingsPaths = [
    join(homedir(), ".pi", "agent", "settings.json"),
    join(process.cwd(), ".pi", "settings.json"),
  ];
  
  for (const settingsPath of settingsPaths) {
    if (!existsSync(settingsPath)) continue;
    
    try {
      const content = readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(content);
      
      if (settings.degoog) {
        return settings.degoog;
      }
    } catch (error) {
      // Ignore parse errors, continue to next file
    }
  }
  
  return {};
}

/**
 * Degoog設定を取得（環境変数 > settings.json）
 */
function getDegoogConfig(): DegoogConfig {
  // まず環境変数を確認
  const envUrl = process.env.DEGOOGL_URL?.trim();
  const envApiKey = process.env.DEGOOGL_API_KEY?.trim();
  
  if (envUrl) {
    return {
      url: envUrl.replace(/\/$/, ''),
      apiKey: envApiKey || undefined,
    };
  }
  
  // 環境変数がなければsettings.jsonから読み込む
  const settingsConfig = loadConfigFromSettings();
  
  if (settingsConfig.url) {
    return {
      url: settingsConfig.url.replace(/\/$/, ''),
      apiKey: settingsConfig.apiKey || envApiKey || undefined,
    };
  }
  
  throw new Error(
    "Degoog configuration not found.\n\n" +
    "Option 1: Set environment variables\n" +
    "  export DEGOOGL_URL='https://your-degoog-instance.com'\n" +
    "  export DEGOOGL_API_KEY='your-api-key'  # optional\n\n" +
    "Option 2: Add to ~/.pi/agent/settings.json\n" +
    '  {\n' +
    '    "degoog": {\n' +
    '      "url": "https://your-degoog-instance.com",\n' +
    '      "apiKey": "your-api-key"  // optional\n' +
    '    }\n' +
    '  }'
  );
}

// 検索タイプ
type SearchType = "web" | "images" | "videos" | "news";

// 時間範囲
type TimeRange = "any" | "hour" | "day" | "week" | "month" | "year";

/**
 * Degoog APIで検索を実行
 */
async function searchDegoog(
  query: string,
  options: {
    type?: SearchType;
    page?: number;
    time?: TimeRange;
    lang?: string;
  } = {}
): Promise<DegoogSearchResponse> {
  const config = getDegoogConfig();
  
  const params = new URLSearchParams({
    q: query,
    type: options.type || "web",
  });
  
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }
  
  if (options.time && options.time !== "any") {
    params.set("time", options.time);
  }
  
  if (options.lang) {
    params.set("lang", options.lang);
  }
  
  const searchUrl = `${config.url}/api/search?${params.toString()}`;
  
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }
  
  const response = await fetch(searchUrl, {
    method: "GET",
    headers,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Degoog API error: ${response.status} ${response.statusText}\n` +
      `URL: ${searchUrl}\n` +
      `Response: ${errorText}`
    );
  }
  
  return await response.json() as DegoogSearchResponse;
}

/**
 * 検索結果をフォーマット
 */
function formatSearchResults(response: DegoogSearchResponse): string {
  const lines: string[] = [];
  
  lines.push(`🔍 Search results for: "${response.query}"`);
  lines.push(`   Type: ${response.type} | Time: ${response.totalTime}ms`);
  lines.push("");
  
  if (response.results.length === 0) {
    lines.push("No results found.");
    return lines.join("\n");
  }
  
  response.results.forEach((result, index) => {
    lines.push(`${index + 1}. ${result.title}`);
    lines.push(`   ${result.url}`);
    if (result.snippet) {
      lines.push(`   ${result.snippet}`);
    }
    lines.push(`   Sources: ${result.sources.join(", ")} | Score: ${result.score}`);
    lines.push("");
  });
  
  if (response.relatedSearches && response.relatedSearches.length > 0) {
    lines.push("Related searches:");
    response.relatedSearches.forEach(term => {
      lines.push(`  • ${term}`);
    });
    lines.push("");
  }
  
  lines.push("Engine timings:");
  response.engineTimings.forEach(engine => {
    const status = engine.status === "ok" ? "✓" : `✗ (${engine.errorReason || engine.status})`;
    lines.push(`  ${engine.name}: ${engine.time}ms (${engine.resultCount} results) ${status}`);
  });
  
  return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
  // web_search ツールを登録
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web using Degoog metasearch engine",
    promptSnippet: "Search the web for information, documentation, or references",
    promptGuidelines: [
      "Use web_search when you need to find current information, documentation, or references on the web",
      "web_search returns results from multiple search engines (Google, Bing, DuckDuckGo, Brave, etc.)",
    ],
    
    parameters: Type.Object({
      query: Type.String({ 
        description: "Search query" 
      }),
      type: Type.Optional(StringEnum(["web", "images", "videos", "news"] as const, {
        description: "Search type (default: web)",
        default: "web"
      })),
      time: Type.Optional(StringEnum(["any", "hour", "day", "week", "month", "year"] as const, {
        description: "Time range filter (default: any)"
      })),
      lang: Type.Optional(Type.String({ 
        description: "Language code (ISO 639-1, e.g., 'en', 'ja')" 
      })),
      page: Type.Optional(Type.Number({ 
        description: "Page number (1-10, default: 1)",
        minimum: 1,
        maximum: 10
      })),
    }),
    
    async execute(_toolCallId, params, signal, onUpdate, _ctx) {
      try {
        // 進行状況を表示
        onUpdate?.({
          content: [{ 
            type: "text", 
            text: `🔍 Searching for: "${params.query}"...` 
          }],
          details: { status: "searching" },
        });
        
        // 検索を実行
        const response = await searchDegoog(params.query, {
          type: params.type,
          time: params.time,
          lang: params.lang,
          page: params.page,
        });
        
        // 結果をフォーマット
        const formatted = formatSearchResults(response);
        
        return {
          content: [{ type: "text", text: formatted }],
          details: {
            query: response.query,
            resultCount: response.results.length,
            totalTime: response.totalTime,
            results: response.results,
            engineTimings: response.engineTimings,
            relatedSearches: response.relatedSearches,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Web search failed: ${errorMessage}`);
      }
    },
    
    // カスタムレンダリング
    renderCall(args, theme, _context) {
      const query = args.query || "";
      const type = args.type || "web";
      const time = args.time || "any";
      
      let text = theme.fg("toolTitle", theme.bold("web_search "));
      text += theme.fg("muted", `[${type}]`);
      if (time !== "any") {
        text += theme.fg("muted", ` [${time}]`);
      }
      text += " " + theme.fg("accent", `"${query}"`);
      
      return new Text(text, 0, 0);
    },
    
    renderResult(result, options, theme, _context) {
      if (options.isPartial) {
        return new Text(theme.fg("warning", "Searching..."), 0, 0);
      }
      
      if (result.isError) {
        const errorText = result.content?.[0]?.text || "Unknown error";
        return new Text(theme.fg("error", `✗ ${errorText}`), 0, 0);
      }
      
      const resultCount = result.details?.resultCount || 0;
      const totalTime = result.details?.totalTime || 0;
      
      let text = theme.fg("success", `✓ ${resultCount} results`);
      text += theme.fg("muted", ` (${totalTime}ms)`);
      
      return new Text(text, 0, 0);
    },
  });
  
  // /degoog-config コマンドを登録
  pi.registerCommand("degoog-config", {
    description: "Show Degoog configuration and test connection",
    handler: async (_args, ctx) => {
      const envUrl = process.env.DEGOOGL_URL?.trim();
      const envApiKey = process.env.DEGOOGL_API_KEY?.trim();
      const settingsConfig = loadConfigFromSettings();
      
      const lines: string[] = [];
      lines.push("🔧 Degoog Configuration");
      lines.push("");
      lines.push("Environment variables:");
      lines.push(`  DEGOOGL_URL: ${envUrl || "(not set)"}`);
      lines.push(`  DEGOOGL_API_KEY: ${envApiKey ? "(set)" : "(not set)"}`);
      lines.push("");
      lines.push("settings.json:");
      lines.push(`  url: ${settingsConfig.url || "(not set)"}`);
      lines.push(`  apiKey: ${settingsConfig.apiKey ? "(set)" : "(not set)"}`);
      lines.push("");
      
      try {
        const config = getDegoogConfig();
        lines.push(`✓ Active configuration:`);
        lines.push(`  URL: ${config.url}`);
        lines.push(`  API Key: ${config.apiKey ? "(set)" : "(not set)"}`);
        lines.push("");
        
        // 接続テスト
        lines.push("Testing connection...");
        ctx.ui.notify(lines.join("\n"), "info");
        
        const testResponse = await searchDegoog("test", { type: "web" });
        
        const successLines = [
          "✅ Connection successful!",
          "",
          `Engine count: ${testResponse.engineTimings.length}`,
          `Response time: ${testResponse.totalTime}ms`,
        ];
        
        ctx.ui.notify(successLines.join("\n"), "info");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lines.push(`❌ Configuration error:\n${errorMessage}`);
        ctx.ui.notify(lines.join("\n"), "error");
      }
    },
  });
  
  // セッション開始時に設定を確認
  pi.on("session_start", async (_event, ctx) => {
    try {
      const config = getDegoogConfig();
      // 設定が有効な場合は何も表示しない（静かに成功）
    } catch (error) {
      ctx.ui.notify(
        "⚠️ Degoog: Configuration not found. web_search tool will not work.\n" +
        "Run /degoog-config for setup instructions.",
        "warning"
      );
    }
  });
}
