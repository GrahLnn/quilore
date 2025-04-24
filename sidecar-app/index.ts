import { Rettiwt } from "rettiwt-api";

// 获取命令行参数
const [_, __, command, ...args] = process.argv;

async function main() {
  const auth = new Rettiwt({
    apiKey: process.env.TWITTER_COOKIE, // 推荐使用环境变量传 cookie
  });

  if (command === "fetchLikes") {
    const cursor = args[0] || "";
    const res = await auth.user.likes(100, cursor);
    const out = {
      list: res.list,
      next: res.next,
    };
    console.log(JSON.stringify(out));
  } else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}
main();
