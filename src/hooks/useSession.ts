import { useState, useEffect, useRef, useCallback } from "react";
import { GamePhase, IpcMethod, ISession, Routes } from "../interfaces";
import { ipc, findChampionIcon } from "../utils";
import { useGame } from "../context/gameContext";
import { useVoip } from "../context/voipContext";

import SocketService from "../services/socket";
import PlayerService from "../services/player";

const useSession = (initialIntervalMS = 2500) => {
  const [intervalMS, setIntervalMS] = useState(initialIntervalMS);
  const lastPhase = useRef<any>();
  const { setTeams, setData } = useGame();
  const { leaveRoom, setShowVoip } =
    useVoip();

  const fetchSession = useCallback(async () => {
    const result: ISession = await ipc(IpcMethod.GET, Routes.SESSION);
    if (result?.error !== GamePhase.ERRORMENU) {
      if (
        result.phase === GamePhase.READYCHECK &&
        lastPhase.current !== GamePhase.READYCHECK
      ) {
        const response = await ipc(IpcMethod.POST, Routes.ACCEPT);

        if (response.state === GamePhase.READYCHECK) {
          await ipc(IpcMethod.POST, Routes.ACCEPT);
        }
      }

      if (result.phase === GamePhase.INPROGRESS) {
        setIntervalMS(10000);
        const player = await ipc(IpcMethod.GET, Routes.PLAYER);

        await Promise.all(
          result.gameData.teamOne.map(async (player: any) => {
            const iconUrl = await findChampionIcon(player.championId);
            player.championIcon = iconUrl;
          })
        );

        await Promise.all(
          result.gameData.teamTwo.map(async (player: any) => {
            const iconUrl = await findChampionIcon(player.championId);
            player.championIcon = iconUrl;
          })
        );

        const isT1 = result.gameData.teamOne.some(
          ({ summonerId }) => summonerId === player.summonerId
        );


        SocketService.setRoomId(`${result.gameData.gameId}${isT1 ? "T1" : "T2"}`);
        PlayerService.initialize(player.summonerId, player.name);
        setShowVoip(true);
      }

      if (result.phase === GamePhase.END) {
        if (lastPhase.current !== GamePhase.END) leaveRoom();
      }

      lastPhase.current = result.phase;

      setTeams({
        teamOne: result.gameData.teamOne,
        teamTwo: result.gameData.teamTwo,
      });

      setData((prev) =>
        JSON.stringify(prev) !== JSON.stringify(result) ? result : prev
      );
    } else {
      setIntervalMS(2500);
    }
  }, [
    setTeams,
    setData,
    leaveRoom,
  ]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, intervalMS);
    return () => clearInterval(interval);
  }, [fetchSession, intervalMS]);
};

export default useSession;