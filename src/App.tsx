import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import TopBar from "./topbar";
import { ContentPage } from "./pages/pages";
import { useEffect } from "react";
import { crab } from "./cmd/commandAdapter";
import { cn } from "@/lib/utils";
import { station } from "./subpub/buses";
import { Page } from "./subpub/type";
import { Scrollbar } from "./components/scrollbar/scrollbar";
import Sidebar from "./components/sidebar";

function App() {
  const setPage = station.page.useSet();
  const setSaveDir = station.saveDir.useSet();
  const setCollection = station.categorys.useSet();

  useEffect(() => {
    crab.appReady();
    const fetchData = async () => {
      const result = await crab.getMetaValue("FirstLaunch");
      result.tap((v) => {
        if (!v) setPage(Page.Welcome);
      });
      const savedir = await crab.getSaveDir();
      savedir.tap((v) => {
        setSaveDir(v);
      });
      const collections = await crab.allCollection();
      collections.tap((v) => {
        setCollection(v);
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
        <ContentPage />
      </main>
      <Toaster />
      <Scrollbar />
      <Sidebar />
    </div>
  );
}

export default App;
