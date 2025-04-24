export type CookieFormat =
  | "netscape"
  | "json"
  | "header"
  | "base64-netscape"
  | "base64-json"
  | "base64-header"
  | "invalid";

export function detectCookieFormat(input: string): CookieFormat {
  // --- Helper Functions (保持不变) ---

  // Netscape 格式检查
  const netscapeHeaderPattern = /^# Netscape HTTP Cookie File/im; // i flag for case-insensitivity just in case
  const netscapeLinePattern =
    /^[^\t]+\t(TRUE|FALSE)\t[^\t]+\t(TRUE|FALSE)\t\d+\t[^\t]*\t[^\t]*$/; // Loosened last two fields slightly

  const isValidNetscape = (text: string): boolean => {
    const lines = text
      .trim()
      .split("\n")
      .map((line) => line.trim());
    if (!lines[0] || !netscapeHeaderPattern.test(lines[0])) return false; // Use test() for regex
    const dataLines = lines
      .slice(1)
      .filter((line) => line && !line.startsWith("#"));
    return (
      dataLines.length > 0 &&
      dataLines.every((line) => netscapeLinePattern.test(line))
    );
  };

  // JSON Cookie 格式检查
  const isValidJsonCookies = (s: string): boolean => {
    try {
      const parsedData = JSON.parse(s);
      if (typeof parsedData !== "object" || parsedData === null) {
        return false;
      }

      const isValidCookieObject = (cookie: any): boolean =>
        typeof cookie === "object" &&
        cookie !== null &&
        typeof cookie.name === "string" &&
        cookie.value !== undefined; // Basic check

      if (Array.isArray(parsedData)) {
        // Must contain at least one valid cookie object if not empty
        return parsedData.length === 0 || parsedData.some(isValidCookieObject);
        // Or stricter: return parsedData.length > 0 && parsedData.every(isValidCookieObject);
      }

      if (typeof parsedData === "object" && !Array.isArray(parsedData)) {
        return isValidCookieObject(parsedData);
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  // Header 格式检查
  const isValidHeaderCookies = (s: string): boolean => {
    const trimmed = s.trim();
    if (!trimmed) return false;
    // Checks for at least one key=value pair, separated by semicolons.
    // Allows various standard cookie characters in name and value.
    // More permissive regex might be needed depending on real-world cookie values.
    return /^\s*([^=;\s]+=[^=;\s]*)(?:\s*;\s*[^=;\s]+=[^=;\s]*)*\s*$/.test(
      trimmed
    );
  };

  // --- Browser-safe Base64 Decoding Function ---
  const decodeBase64 = (base64Input: string): string | null => {
    try {
      // 1. Decode Base64 to binary string
      const binaryString = atob(base64Input);
      // 2. Convert binary string to byte array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // 3. Decode byte array as UTF-8 string
      const decoder = new TextDecoder("utf-8"); // Specify UTF-8 encoding
      return decoder.decode(bytes);
    } catch (error) {
      // If atob fails (invalid base64) or TextDecoder fails
      console.error("Base64 decoding failed:", error); // Optional logging
      return null; // Indicate failure
    }
  };

  // --- Detection Logic ---

  // 1. 原始格式检查
  if (isValidNetscape(input)) return "netscape";
  if (isValidJsonCookies(input)) return "json";
  if (isValidHeaderCookies(input)) return "header";

  // 2. 尝试 base64 解码再判断
  const decoded = decodeBase64(input);

  if (decoded !== null) {
    // Only proceed if decoding was successful
    if (isValidNetscape(decoded)) return "base64-netscape";
    if (isValidJsonCookies(decoded)) return "base64-json";
    if (isValidHeaderCookies(decoded)) return "base64-header";
  }

  // 3. 所有检查都失败
  return "invalid";
}

export function isValidCookies(input: string) {
  return detectCookieFormat(input) !== "invalid";
}

export function convertToBase64HeaderCookie(input: string): string | undefined {
  const format = detectCookieFormat(input);

  let header: string | null = null;

  if (format === "header") {
    header = input.trim();
  } else if (format === "json" || format === "base64-json") {
    const decoded = format.startsWith("base64") ? atob(input) : input;
    const obj = JSON.parse(decoded);
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      header = Object.entries(obj)
        .map(([key, val]) => `${key}=${val}`)
        .join("; ");
    }
  } else if (format === "netscape" || format === "base64-netscape") {
    const decoded = format.startsWith("base64") ? atob(input) : input;
    const lines = decoded
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    const keyValues = lines.map((line) => {
      const parts = line.split("\t");
      return `${parts[5]}=${parts[6]}`;
    });

    header = keyValues.join("; ");
  }

  if (header) {
    return btoa(header); // base64 encode
  }
}

export function isTwitterLoginCookie(input: string): boolean {
  const requiredKeys = ["kdt", "twid", "ct0", "auth_token"];
  const format = detectCookieFormat(input);

  let cookieMap: Record<string, string> = {};

  try {
    if (format === "json" || format === "base64-json") {
      const decoded = format.startsWith("base64") ? atob(input) : input;
      const obj = JSON.parse(decoded);
      if (typeof obj !== "object" || obj === null) return false;
      cookieMap = obj;
    } else if (format === "header" || format === "base64-header") {
      const decoded = format.startsWith("base64") ? atob(input) : input;
      const pairs = decoded.split(";").map((kv) => kv.trim().split("="));
      for (const [key, val] of pairs) {
        if (key && val !== undefined) {
          cookieMap[key] = val;
        }
      }
    } else if (format === "netscape" || format === "base64-netscape") {
      const decoded = format.startsWith("base64") ? atob(input) : input;
      const lines = decoded
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      for (const line of lines) {
        const parts = line.split("\t");
        const key = parts[5];
        const val = parts[6];
        if (key && val !== undefined) {
          cookieMap[key] = val;
        }
      }
    }
  } catch {
    return false;
  }

  return requiredKeys.every((key) => key in cookieMap);
}

export function getMissingTwitterLoginFields(input: string): string | null {
  const requiredKeys = ["kdt", "twid", "ct0", "auth_token"];
  const format = detectCookieFormat(input);

  let cookieMap: Record<string, string> = {};

  try {
    if (format === "json" || format === "base64-json") {
      const decoded = format.startsWith("base64") ? atob(input) : input;
      const obj = JSON.parse(decoded);
      if (typeof obj !== "object" || obj === null) return "无法解析 JSON 格式";
      cookieMap = obj;
    } else if (format === "header" || format === "base64-header") {
      const decoded = format.startsWith("base64") ? atob(input) : input;
      const pairs = decoded.split(";").map((kv) => kv.trim().split("="));
      for (const [key, val] of pairs) {
        if (key && val !== undefined) {
          cookieMap[key] = val;
        }
      }
    } else if (format === "netscape" || format === "base64-netscape") {
      const decoded = format.startsWith("base64") ? atob(input) : input;
      const lines = decoded
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      for (const line of lines) {
        const parts = line.split("\t");
        const key = parts[5];
        const val = parts[6];
        if (key && val !== undefined) {
          cookieMap[key] = val;
        }
      }
    } else {
      return "无效的 Cookie 格式";
    }
  } catch (e) {
    return "解析出错";
  }

  const missing = requiredKeys.filter((key) => !(key in cookieMap));
  return missing.length > 0 ? `缺失字段: ${missing.join(", ")}` : null;
}
