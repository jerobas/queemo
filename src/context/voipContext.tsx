import { createContext, useContext, useState, useEffect, useMemo } from "react";
///import { useToast } from "./toastContext";
import { VoipContextType, VoipProviderProps } from "../interfaces";
import { useNavigate } from "react-router-dom";

import PeerService from "../services/peer.ts";
import SocketService from "../services/socket.ts";
import { AudioService, MyStream } from "../services/audio.ts";

const VoipContext = createContext<VoipContextType>({} as VoipContextType);

export const useVoip = () => useContext(VoipContext);

export const VoipProvider = ({ children }: VoipProviderProps) => {
  const [showVoip, setShowVoip] = useState<boolean>(false);

  const navigate = useNavigate();

  const [version, setVersion] = useState(0);

  useEffect(() => {
    SocketService.socketUsers.onChange(() => setVersion((v) => v + 1));
    SocketService.inRoom.onChange(() => setVersion((v) => v + 1));
    AudioService.audioStreams.onChange(() => setVersion((v) => v + 1));
    MyStream.isSelfMuted.onChange(() => setVersion((v) => v + 1));

    return () => {
      SocketService.socketUsers.clear();
      SocketService.inRoom.clear();
      AudioService.audioStreams.clear();
      MyStream.isSelfMuted.clear();
      leaveRoom();
    };
  }, []);

  useEffect(() => {
    console.log("updated version");
  }, [version]);

  //const notify = useToast();
  //return notify.warning("Ocorreu um erro ao entrar na call");

  const joinRoom = async () => {
    // this will throw an error, handle it after
    MyStream.get();
    SocketService.connect();
    // DONT FORGET TO MAKE onSelectedDeviceChange
    PeerService.initialize();
  };

  const leaveRoom = () => {
    SocketService.leaveRoom();

    AudioService.audioStreams.clear();

    PeerService.disconnect();

    setShowVoip(false);
    navigate("/");
  };

  const voipContextValue = useMemo(
    () => ({
      joinRoom,
      leaveRoom,
      showVoip,
      setShowVoip,
    }),
    [joinRoom, leaveRoom, showVoip, version]
  );

  return (
    <VoipContext.Provider value={voipContextValue}>
      {children}
    </VoipContext.Provider>
  );
};
