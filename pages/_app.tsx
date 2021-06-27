import type { AppProps } from "next/app";
import "../styles/_global.scss";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Component {...pageProps} />
    </DndProvider>
  );
}
export default MyApp;
