import { useState, useEffect, useRef, useCallback } from "react";
import { GamePhase, ISession } from "../interfaces";
import { useGame } from "../context/gameContext";
import { useVoip } from "../context/voipContext";
import LcuService from "../services/lcu.ts";

const useSession = (initialIntervalMS = 2500) => {
  const [intervalMS, setIntervalMS] = useState(initialIntervalMS);
  const { setData } = useGame();
  const { leaveRoom, setShowVoip } = useVoip();

  const lastData = useRef<ISession | null>(null);

  useEffect(() => {
    LcuService.setContextHooks({ leaveRoom, setShowVoip });
  }, [leaveRoom, setShowVoip]);

  const fetchSession = useCallback(async () => {
    const session = await LcuService.getSession();

    if (session?.error !== GamePhase.ERRORMENU) {
      await LcuService.handlePhase(session);

      if (JSON.stringify(lastData.current) !== JSON.stringify(session)) {
        setData(session);
        lastData.current = session;
      }
    } else {
      setIntervalMS(2500);
    }
  }, [setData]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, intervalMS);
    return () => clearInterval(interval);
  }, [fetchSession, intervalMS]);
};

export default useSession;