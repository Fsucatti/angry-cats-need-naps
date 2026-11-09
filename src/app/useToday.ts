import { useEffect, useState } from "react";
import { dateKey } from "../daily/dates";

/** La fecha de hoy, actualizada al volver a la pestaña. */
export function useToday(): string {
  const [today, setToday] = useState(() => dateKey(new Date()));
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) setToday(dateKey(new Date()));
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return today;
}
