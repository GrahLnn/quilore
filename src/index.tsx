import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WindowsControlsPortal from "./windowctrl/windows";
import MacOSControlsPortal from "./windowctrl/macos";
import { platform } from "@tauri-apps/plugin-os";

const os = platform();

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      {os === "windows" && <WindowsControlsPortal />}
      {os === "macos" && <MacOSControlsPortal />}
      <App />
    </React.StrictMode>
  );
}
