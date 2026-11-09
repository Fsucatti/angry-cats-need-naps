import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { connectAudioToPage } from "./audio";
import { dateKey } from "./daily/dates";
import { resolveWebDate } from "./daily/webRoute";
import { AudioControl } from "./screens/AudioControl";
import { WebDaily } from "./screens/WebDaily";
import "./screens/board.css";

/** La raíz abre el juego completo; /d/fecha, solo el desafío de esa fecha. */
function webDailyRoute(): { show: boolean; date: string | null } {
  const match = /^\/d\/([^/]+)\/?$/.exec(location.pathname);
  if (!match) return { show: false, date: null };
  const date = resolveWebDate(match[1], dateKey(new Date()));
  if (date && location.pathname !== `/d/${date}`) history.replaceState(null, "", `/d/${date}`);
  return { show: true, date };
}

const route = webDailyRoute();

connectAudioToPage();

createRoot(document.getElementById("root")!).render(
  <>
    <AudioControl />
    {route.show ? <WebDaily date={route.date} /> : <App />}
  </>,
);
