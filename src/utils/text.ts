function formatContent(content: string, replaceUrls?: string[]): string {
  if (!content) return "";

  // 如果传入了 URL 列表，则先按照 URL 长度降序排序（较长的先替换，防止子串冲突）
  const expandedUrls = replaceUrls
    ? [...replaceUrls].sort((a, b) => b.length - a.length)
    : [];

  // 用占位符先替换 URL，避免 html.escape 时破坏链接
  let modifiedContent = content;
  const placeholders: { [key: string]: string } = {};

  expandedUrls.forEach((url, i) => {
    const placeholder = `__URL_PLACEHOLDER_${i}__`;
    placeholders[placeholder] = url;
    // 替换所有出现的 URL（使用 split/join 实现全局替换）
    modifiedContent = modifiedContent.split(url).join(placeholder);
  });

  // 对内容进行 HTML 转义
//   let escapedText = htmlEscape(modifiedContent);

  // 将占位符还原成 HTML 链接
  for (const [placeholder, url] of Object.entries(placeholders)) {
    // 获取 URL 的最后一段作为链接文本
    const parts = url.split("/").filter((segment) => segment.length > 0);
    const linkText = parts.length ? parts[parts.length - 1] : url;
    const htmlLink = `<a href="${url}" target="_blank" class="link">${linkText}</a>`;
    modifiedContent = modifiedContent.split(placeholder).join(htmlLink);
  }

  return modifiedContent;
}

// 简单的 HTML 转义函数
function htmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
