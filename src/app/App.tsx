import { useEffect, useState } from "react";
import { DIFFICULTIES, type Difficulty } from "../economy/balance";
import { isUnlocked } from "../economy/player";
import { newGame } from "../engine/game";
import { generateBoard } from "../engine/generator";
import { mulberry32 } from "../engine/rng";
import { BoardView, type BoardMode } from "../screens/Board";
import { Cats } from "../screens/Cats";
import { Daily } from "../screens/Daily";
import { Game } from "../screens/Game";
import { Shelter } from "../screens/Shelter";
import { Tutorial } from "../screens/Tutorial";
import { usePlayer } from "./store";

function useHashRoute(): [string, (route: string) => void] {
  const [route, setRoute] = useState(() => location.hash.replace(/^#\/?/, ""));
  useEffect(() => {
    const onChange = () => setRoute(location.hash.replace(/^#\/?/, ""));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const go = (next: string) => {
    if (next) location.hash = `#/${next}`;
    else location.replace("#/");
  };
  return [route, go];
}

/** Solo en desarrollo: muestra un tablero para las pruebas de tamaño. */
function BoardPreview({ difficulty }: { difficulty: Difficulty }) {
  const [state] = useState(() => newGame(generateBoard(DIFFICULTIES[difficulty], mulberry32(7), 5000)!));
  const [flagged, setFlagged] = useState(state);
  const [mode, setMode] = useState<BoardMode>("reveal");
  return (
    <main className="screen">
      <BoardView
        state={flagged}
        mode={mode}
        onModeChange={setMode}
        onReveal={() => undefined}
        onFlag={(i) =>
          setFlagged((s) => {
            const next = [...s.flagged];
            next[i] = !next[i];
            return { ...s, flagged: next };
          })
        }
      />
    </main>
  );
}

export function App() {
  const ready = usePlayer((s) => s.ready);
  const init = usePlayer((s) => s.init);
  const player = usePlayer((s) => s.player);
  const [route, go] = useHashRoute();
  // Sigue en el tutorial hasta que se cierre el mensaje final, aunque ya esté registrado.
  const [inTutorial, setInTutorial] = useState(false);
  if (ready && !player.tutorialDone && !inTutorial) setInTutorial(true);

  useEffect(() => {
    void init();
  }, [init]);

  if (!ready) return <div data-testid="app-root" />;

  const [name, param] = route.split("/");

  let screen;
  if (import.meta.env.DEV && name === "board-preview") {
    screen = <BoardPreview difficulty={param as Difficulty} />;
  } else if (!player.tutorialDone || inTutorial) {
    screen = (
      <Tutorial
        onDone={() => {
          setInTutorial(false);
          go("");
        }}
      />
    );
  } else if (name === "play" && param in DIFFICULTIES && isUnlocked(player, param as Difficulty)) {
    screen = <Game key={param} difficulty={param as Difficulty} onExit={() => go("")} />;
  } else if (name === "cats") {
    screen = <Cats onBack={() => go("")} />;
  } else if (name === "daily") {
    screen = <Daily onBack={() => go("")} />;
  } else {
    screen = <Shelter onPlay={(d) => go(`play/${d}`)} onCats={() => go("cats")} onDaily={() => go("daily")} />;
  }

  return <div data-testid="app-root">{screen}</div>;
}
