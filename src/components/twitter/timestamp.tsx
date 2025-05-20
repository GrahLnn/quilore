import { memo } from "react";

interface TimestampCompProps {
  time: string;
}

const TimestampEle = memo(function TimestampComp({ time }: TimestampCompProps) {
  if (!time) return "";
  const date = new Date(time);
  return date
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
});

export default TimestampEle;
