import { createRoot } from "react-dom/client";
import App from "../components/App";
import "./popup.css";

const rootDiv = document.getElementById("popup-root");
console.log(rootDiv);
if (!rootDiv) {
  throw new Error("No root element found with the id 'popup-root'");
}
const root = createRoot(rootDiv);
root.render(<App />);
