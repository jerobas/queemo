import { useNavigate } from "react-router-dom";
import { IpcMethod, Routes, GamePhase, ISession } from "../interfaces";
import { ipc, findChampionIcon } from "../utils";
import SocketService from "./socket";
import PlayerService from "./player";
import RoomService from "./room";

type Handler = (session: ISession) => Promise<void>;

const handlerStub = async (_session: ISession) => {};

class LcuService {
  static lastPhase: GamePhase | null = null;
  static leaveRoom: () => void;
  static setShowVoip: (b: boolean) => void;
  static autoJoin: boolean;
  static joinRoom: () => void;
  static navigate: ReturnType<typeof useNavigate>;

  static phaseHandlers: Partial<Record<GamePhase, Handler>> = {
    [GamePhase.READYCHECK]: LcuService.handleReadyCheck,
    [GamePhase.INPROGRESS]: LcuService.handleInProgress,
    [GamePhase.END]: LcuService.handleEnd,
  };

  static handlers: Record<GamePhase, Handler> = Object.fromEntries(
    Object.values(GamePhase).map((phase) => {
      const fn = LcuService.phaseHandlers[phase];
      return [phase, fn ? fn.bind(LcuService) : handlerStub];
    })
  ) as Record<GamePhase, Handler>;

  static setContextHooks({
    leaveRoom,
    setShowVoip,
    autoJoinCall,
    joinRoom,
    navigate,
  }: {
    leaveRoom: () => void;
    setShowVoip: (b: boolean) => void;
    autoJoinCall: boolean;
    joinRoom: () => void;
    navigate: ReturnType<typeof useNavigate>;
  }) {
    this.leaveRoom = leaveRoom;
    this.setShowVoip = setShowVoip;
    this.autoJoin = autoJoinCall;
    this.joinRoom = joinRoom;
    this.navigate = navigate;
  }

  static async getSession(): Promise<ISession> {
    return ipc(IpcMethod.GET, Routes.SESSION);
  }

  static async handlePhase(session: ISession) {
    const handler = this.handlers[session.phase as GamePhase];
    if (handler) await handler(session);
    this.lastPhase = session.phase as GamePhase;
  }

  static async handleReadyCheck(_session: ISession) {
    if (this.lastPhase !== GamePhase.READYCHECK) {
      const response = await ipc(IpcMethod.POST, Routes.ACCEPT);
      if (response.state === GamePhase.READYCHECK) {
        await ipc(IpcMethod.POST, Routes.ACCEPT);
      }
    }
  }

  static async handleInProgress(session: ISession) {
    if (this.lastPhase === GamePhase.INPROGRESS) return;

    const player = await ipc(IpcMethod.GET, Routes.PLAYER);

    await Promise.all([
      ...session.gameData.teamOne.map(async (p: any) => {
        p.championIcon = await findChampionIcon(p.championId);
      }),
      ...session.gameData.teamTwo.map(async (p: any) => {
        p.championIcon = await findChampionIcon(p.championId);
      }),
    ]);

    RoomService.teams = session.gameData;

    const isT1 = session.gameData.teamOne.some(
      ({ summonerId }) => summonerId === player.summonerId
    );

    SocketService.setRoomId(`${session.gameData.gameId}${isT1 ? "T1" : "T2"}`);
    PlayerService.initialize(player.summonerId, player.name);
    this.setShowVoip?.(true);
    if (this.autoJoin) {
      this.navigate("/voip");
      this.joinRoom();
    }
  }

  static async handleEnd(_session: ISession) {
    if (this.lastPhase !== GamePhase.END) {
      this.leaveRoom?.();
    }
  }
}

export default LcuService;
