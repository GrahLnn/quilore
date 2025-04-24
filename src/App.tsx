import "./App.css";
import { Toaster } from "@/components/ui/sonner";
// import { Lightbox } from "./components/lightbox/lightbox";
import { Lightbox } from "./components/modalbox/lightbox";
import { Scrollbar } from "./components/scrollbar/scrollbar";
import Posts from "./pages/posts";
import TopBar from "./topbar";
import { randerPage } from "./pages/pages";
import { useEffect } from "react";
import { crab } from "./cmd/commandAdapter";
import { MetaKey } from "./cmd/commands";
import { setPageName, Page } from "./subpub/pageBus";

function App() {
  useEffect(() => {
    const fetchData = async () => {
      const result = await crab.getMetaValue("FirstLaunch");
      result.tap((v) => {
        // console.log(v);
        if (!v) setPageName(Page.Welcome);
      });
    };

    fetchData();
  }, []);
  return (
    <div className="min-h-screen flex flex-col overflow-hidden hide-scrollbar">
      <TopBar />

      <main className="flex flex-1 overflow-hidden mt-8 hide-scrollbar">
        {/* <Posts /> */}
        {randerPage()}
      </main>
      <Toaster />
      <Lightbox />
      <Scrollbar />
    </div>
  );
}

export default App;
