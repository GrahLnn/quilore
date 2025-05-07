import "./App.css";
import { Toaster } from "@/components/ui/sonner";
// import { Lightbox } from "./components/lightbox/lightbox";
import { Lightbox } from "./components/modalbox/lightbox";
// import { Scrollbar } from "./components/scrollbar/scrollbar";
import Posts from "./pages/plat/posts";
import TopBar from "./topbar";
import { ContentPage } from "./pages/pages";
import { useEffect } from "react";
import { crab } from "./cmd/commandAdapter";
import { MetaKey } from "./cmd/commands";
import { setPageName, Page, usePageName } from "./subpub/pageBus";
import { cn } from "@/lib/utils";
import { station } from "./subpub/buses";

function App() {
  const page = usePageName();
  const shouldFlex = station.mainFlex.useValue();
  useEffect(() => {
    const fetchData = async () => {
      const result = await crab.getMetaValue("FirstLaunch");
      result.tap((v) => {
        if (!v) setPageName(Page.Welcome);
      });
      const savedir = await crab.getSaveDir();
      savedir.tap((v) => {
        station.saveDir.setValue(v);
      });
    };

    fetchData();
  }, []);
  return (
    <div className="min-h-screen flex flex-col overflow-hidden hide-scrollbar">
      <TopBar />

      <main
        className={cn([
          "flex flex-col justify-center items-center flex-1 overflow-hidden mt-8 hide-scrollbar",
        ])}
      >
        {/* <Posts /> */}
        <ContentPage />
      </main>
      <Toaster />
      <Lightbox />
      {/* <Scrollbar /> */}
    </div>
  );
}

export default App;
