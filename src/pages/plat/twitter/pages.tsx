import { station } from "@/src/subpub/buses";
import { PrePosts } from "./preposts";
import Posts from "./posts";
import { TwitterPage } from "@/src/subpub/type";
import { useEffect, useState } from "react";
import { crab } from "@/src/cmd/commandAdapter";
import { createAtom } from "@/src/subpub/core";

export const postsStation = {
  isLoading: createAtom(false),
  sortedIdxList: createAtom<Array<{ id: number }>>([]),
  scanning: createAtom(false),
};

export function MatchPages() {
  const [page, setPage] = station.twitter.useAll();
  const [checkdone, setCheckDone] = useState(false);
  const isStartImport = station.startImport.useSee();
  const [need_refresh, setNeedRefresh] = station.needRefresh.useAll();
  const setIsLoading = postsStation.isLoading.useSet();
  const setScanning = postsStation.scanning.useSet();
  const setSortedIdxList = postsStation.sortedIdxList.useSet();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isStartImport) {
      setScanning(true);
      setIsLoading(true);
      setSortedIdxList([]);
      setPage(TwitterPage.Pre);
    }
  }, [isStartImport]);

  useEffect(() => {
    crab.checkHasData().then((r) => {
      r.tap((v) => {
        setCheckDone(true);
        if (v) {
          setPage(TwitterPage.Posts);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (need_refresh) {
      setSortedIdxList([]);
      setKey((k) => k + 1);
      setNeedRefresh(false);
    }
  }, [need_refresh]);

  return (
    checkdone &&
    page.match({
      [TwitterPage.Pre]: () => <PrePosts />,
      [TwitterPage.Posts]: () => <Posts key={key} />,
    })
  );
}
