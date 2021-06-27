import type { AppProps } from "next/app";
import "../styles/_global.scss";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

const touchSupportedDevice =
  (typeof window !== "undefined" && "ontouchstart" in window) ||
  (typeof navigator !== "undefined" &&
    (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0));

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DndProvider backend={touchSupportedDevice ? TouchBackend : HTML5Backend}>
      <Component {...pageProps} />
    </DndProvider>
  );
}
export default MyApp;
