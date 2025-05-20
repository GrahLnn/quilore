import { cn } from "@/lib/utils";
import { Content } from "@/src/cmd/commands";
import { useLanguageState } from "@/src/state_machine/language";
import { DataTag } from "@/src/utils/enums";
import md5 from "md5";
import { motion, AnimatePresence } from "motion/react";
import { memo, useRef, useState, useMemo, useLayoutEffect } from "react";

function processText(text: string, urls: string[] | null) {
  let parts: (string | React.ReactNode)[] | string = text;
  if (urls && urls.length > 0) {
    const sortedUrls = [...urls].sort((a, b) => b.length - a.length);

    // 用占位符替换URL
    const placeholders: Record<string, string> = {};
    let processedText = text;
    for (const [i, url] of sortedUrls.entries()) {
      const placeholder = `__URL_PLACEHOLDER_${i}__`;
      placeholders[placeholder] = url;
      processedText = processedText.split(url).join(placeholder);
    }

    // 分割文本并创建带链接的JSX元素
    parts = [processedText];

    // 处理每个占位符
    for (const [placeholder, url] of Object.entries(placeholders)) {
      // 创建新的parts数组
      const newParts: (string | React.ReactNode)[] = [];

      for (const part of parts) {
        if (typeof part === "string") {
          // 分割字符串部分
          const splitParts = part.split(placeholder);

          // 处理分割后的部分
          for (let i = 0; i < splitParts.length; i++) {
            const text = splitParts[i];

            if (i > 0) {
              const parsedUrl = new URL(url);
              const pathnameParts = parsedUrl.pathname
                .split("/")
                .filter((part) => part.length > 0);

              const lastSegment = pathnameParts.length
                ? `[${decodeURIComponent(pathnameParts[pathnameParts.length - 1])}]`
                : "";

              const linkText = `${parsedUrl.hostname}${lastSegment}`;

              // 添加链接元素
              newParts.push(
                <a
                  key={crypto.randomUUID().slice(0, 8)}
                  href={url}
                  target="_blank"
                  className="text-sky-500 hover:underline"
                  rel="noreferrer"
                >
                  {linkText}
                </a>
              );
            }

            if (text) {
              newParts.push(text);
            }
          }
        } else {
          // 保留非字符串元素
          newParts.push(part);
        }
      }
      parts = newParts;
    }
  }
  return parts;
}

enum LangStateKey {
  original = "original",
  translated = "translated",
}

const ContentEle = memo(function ContentEleComp({
  content,
}: {
  content: Content;
}) {
  const langState = useLanguageState();
  // 定义两个容器的 ref，分别用于显示内容和隐藏测量
  const containerRef = useRef<HTMLDivElement>(null);
  const hideRef = useRef<HTMLDivElement>(null);
  // 使用 useState 存储两个高度值，初始值均为 "auto"
  const [heights, setHeights] = useState<{
    cont: number | "auto";
    hide: number | "auto";
  }>({
    cont: "auto",
    hide: "auto",
  });
  const { displayText, animationKey, symmetryText } = langState.match({
    original: () => ({
      displayText: content.text,
      animationKey: LangStateKey.original + md5(content.text),
      symmetryText:
        content.translation && content.translation !== DataTag.NO_TRANSLATION
          ? content.translation
          : content.text,
    }),
    translated: () => ({
      displayText:
        content.translation && content.translation !== DataTag.NO_TRANSLATION
          ? content.translation
          : content.text,
      animationKey:
        content.translation && content.translation !== DataTag.NO_TRANSLATION
          ? LangStateKey.translated + md5(content.translation)
          : LangStateKey.original + md5(content.text),
      symmetryText: content.text,
    }),
  });
  const parts = useMemo(
    () => processText(displayText, content.expanded_urls),
    [displayText, content.expanded_urls]
  );
  const symmetryParts = useMemo(
    () => processText(symmetryText, content.expanded_urls),
    [symmetryText, content.expanded_urls]
  );
  // 组件加载时只测量一次两个容器的高度，并保存下来（固定数据，不再变化）
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useLayoutEffect(() => {
    const containerEl = containerRef.current;
    const hideEl = hideRef.current;
    if (containerEl && hideEl) {
      const { contH, hideH } = langState.match({
        original: () => ({
          contH: containerEl.offsetHeight,
          hideH: hideEl.offsetHeight,
        }),
        translated: () => ({
          contH: hideEl.offsetHeight,
          hideH: containerEl.offsetHeight,
        }),
      });
      setHeights({
        cont: contH,
        hide: hideH,
      });
    }
  }, []);
  // 在测量完成后移除hideRef元素
  useLayoutEffect(() => {
    if (heights.hide !== "auto") {
      setHideRefMeasured(true);
    }
  }, [heights.hide]);

  // 添加一个状态来控制是否显示hideRef元素
  const [hideRefMeasured, setHideRefMeasured] = useState(false);
  if (!content.text) return null;

  const defaultCN =
    "whitespace-pre-wrap break-words w-full text-left text-[var(--content)]";

  // 根据当前语言状态选择对应的高度值
  const height = langState.match({
    original: () => heights.cont,
    translated: () => heights.hide,
  });

  return (
    // 外层容器负责高度过渡动画
    <motion.div
      transition={{ duration: 0.1, ease: "linear" }}
      animate={{ height: height }}
      className="relative select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          ref={containerRef}
          key={animationKey}
          className={cn([defaultCN])}
          // initial={{ filter: "blur(6px)", opacity: 0 }}
          // animate={{ filter: "blur(0px)", opacity: 1 }}
          // exit={{ filter: "blur(6px)", opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: "linear",
            filter: { clampWhenFinished: true },
          }}
        >
          {parts}
        </motion.div>
      </AnimatePresence>
      {!hideRefMeasured && (
        <div
          ref={hideRef}
          className={cn([defaultCN, "absolute top-0 left-0 w-full opacity-0"])}
        >
          {symmetryParts}
        </div>
      )}
    </motion.div>
  );
});

export default ContentEle;
