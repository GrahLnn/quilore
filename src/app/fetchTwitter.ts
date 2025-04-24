// import { Rettiwt } from "rettiwt-api";
// import { convertToBase64HeaderCookie } from "./checkCookies";
// import { crab } from "../cmd/commandAdapter";
// import { rtry } from "@/lib/result";

// async function fetchLikedTweets(auth: Rettiwt, cursor = "") {
//   const res = await rtry(auth.user.likes(100, cursor));
//   return res.map((v) => ({ list: v.list, next: v.next.value }));
// }

// export async function fetchAllLikedTweets() {
//   const cookie = await crab.getUserkvValue("Twitter");
//   let auth: Rettiwt | null = null;
//   cookie.tap((v) => {
//     if (v) {
//       auth = new Rettiwt({
//         apiKey: convertToBase64HeaderCookie(v),
//       });
//     }
//   });
//   if (!auth) return;
//   let cursor = "";
//   let data = [];
//   const likedRes = await fetchLikedTweets(auth, cursor);
//   likedRes.tap((v) => {
//     data.push(...v.list);
//     cursor = v.next;
//   });
//   console.log(data);
// }
