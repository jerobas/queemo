import { useState, useEffect, useRef, useCallback } from "react";
import { GamePhase, ISession } from "../interfaces";
import { useGame } from "../context/gameContext";
import { useVoip } from "../context/voipContext";
import LcuService from "../services/lcu.ts";
import { useAutoJoin } from "../context/autoJoinContext.tsx";
import { useNavigate } from "react-router-dom";

const useSession = (initialIntervalMS = 2500) => {
  const [intervalMS, setIntervalMS] = useState(initialIntervalMS);
  const { setData } = useGame();
  const { leaveRoom, setShowVoip, joinRoom } = useVoip();
  const { autoJoinCall } = useAutoJoin();
  const navigate = useNavigate();

  const lastData = useRef<ISession | null>(null);

  useEffect(() => {
    LcuService.setContextHooks({
      leaveRoom,
      setShowVoip,
      autoJoinCall,
      joinRoom,
      navigate,
    });
  }, [leaveRoom, setShowVoip, autoJoinCall, joinRoom, navigate]);

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
