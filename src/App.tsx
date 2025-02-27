import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import { commands } from "./commands";
import TopBar from "./topbar";
import Input from "./conponents/Input";
import TweetCard from "./conponents/tweetCard";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // using tauri-specta automatically generates bindings for you
    setGreetMsg(await commands.greet(name));
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-y-auto hide-scrollbar pt-8">
        <div className="flex justify-center items-center flex-col text-center gap-4 py-4">
          <TweetCard />
        </div>
      </main>
    </div>
  );
}

export default App;
