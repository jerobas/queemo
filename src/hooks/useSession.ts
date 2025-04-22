import { useState, useEffect, useRef, useCallback } from "react";
import { GamePhase, ISession } from "../interfaces";
import { useGame } from "../context/gameContext";
import { useVoip } from "../context/voipContext";
import LcuService from "../services/lcu.ts";

const useSession = (initialIntervalMS = 2500) => {
  const [intervalMS, setIntervalMS] = useState(initialIntervalMS);
  const { setTeams, setData } = useGame();
  const { leaveRoom, setShowVoip } = useVoip();

  const lastData = useRef<ISession | null>(null);
  const lastTeams = useRef<string>("");

  useEffect(() => {
    LcuService.setContextHooks({ leaveRoom, setShowVoip });
  }, [leaveRoom, setShowVoip]);

  const fetchSession = useCallback(async () => {
    const session = await LcuService.getSession();

    if (session?.error !== GamePhase.ERRORMENU) {
      await LcuService.handlePhase(session);

      const currentTeams = JSON.stringify({
        teamOne: session.gameData.teamOne,
        teamTwo: session.gameData.teamTwo,
      });

      if (lastTeams.current !== currentTeams) {
        setTeams(session.gameData);
        lastTeams.current = currentTeams;
      }

      if (JSON.stringify(lastData.current) !== JSON.stringify(session)) {
        setData(session);
        lastData.current = session;
      }
    } else {
      setIntervalMS(2500);
    }
  }, [setTeams, setData]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, intervalMS);
    return () => clearInterval(interval);
  }, [fetchSession, intervalMS]);
};

export default useSession;