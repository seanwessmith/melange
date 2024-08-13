import React from "react";
import { createRoot } from "react-dom/client";

const App: React.FC = () => {
  return (
    <div>
      <h1>Hello from the content script!</h1>
    </div>
  );
};

document.addEventListener("DOMContentLoaded", () => {
  const rootDiv = document.getElementById("popup-root");
  if (!rootDiv) {
    throw new Error("No root element found with the id 'popup-root'");
  }
  const root = createRoot(rootDiv);
  root.render(<App />);
});
