import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import { Lightbox } from "./components/lightbox/lightbox";
import { Scrollbar } from "./components/scrollbar/scrollbar";
import Posts from "./pages/posts";
import TopBar from "./topbar";

function App() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden hide-scrollbar">
      <TopBar />

      <main className="flex-1 overflow-hidden mt-8 hide-scrollbar">
        <Posts />
      </main>
      <Toaster />
      <Lightbox />
      <Scrollbar />
    </div>
  );
}

export default App;
