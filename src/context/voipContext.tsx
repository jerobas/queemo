import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo
} from "react";
///import { useToast } from "./toastContext";
import { useGame } from "./gameContext";
import {
  VoipContextType,
  VoipProviderProps,
} from "../interfaces";
import { useAudioInput } from "./audioContext";
import { useNavigate } from "react-router-dom";

import PeerService from "../services/peer.ts";
import SocketService from "../services/socket.ts";
import PlayerService from "../services/player.ts";
import { MediaConnection } from "peerjs";

const VoipContext = createContext<VoipContextType>({} as VoipContextType);

export const useVoip = () => useContext(VoipContext);

export const VoipProvider = ({ children }: VoipProviderProps) => {
  const [showVoip, setShowVoip] = useState<boolean>(false);
  const [audioStreams, setAudioStreams] =
    useState<Record<string, MediaStream>>();
  const [muteStates, setMuteStates] = useState<Record<string, boolean>>({});

  const myAudioRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  console.log("rerunning VoipProvider")

  const [version, setVersion] = useState(0);

  useEffect(() => {
    SocketService.socketUsers.onChange(() => setVersion(v => v + 1));
    SocketService.inRoom.onChange(() => setVersion(v => v + 1));
  }, []);

  //const notify = useToast();
  const { teams } = useGame();
  const { selectedDeviceId } = useAudioInput();

  const callCallback = useCallback((call: MediaConnection) => {
    navigator.mediaDevices
      .getUserMedia({
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      })
      .then((stream) => {
        call.answer(stream);
        call.on("stream", (userStream: MediaStream) => {
          addAudioStream(call.metadata.playerName, userStream);
        });
      });
  }, [selectedDeviceId]);

  const openCallback = useCallback((id: string) => {
    navigator.mediaDevices
      .getUserMedia({
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      })
      .then((stream) => {
        myAudioRef.current = stream;
        SocketService.joinRoom(
          id,
          teams,
          (players) => PeerService.connectToUsers(
            players,
            PlayerService.getPlayerName() || "",
            myAudioRef,
            addAudioStream,
            removeAudioStream
          ),
          removeAudioStream
        )
      });
  }, [selectedDeviceId]);

  //return notify.warning("Ocorreu um erro ao entrar na call");
  const joinRoom = useCallback(() => {
    if (!selectedDeviceId) return;
    SocketService.connect();
    PeerService.initialize(
      callCallback,
      openCallback
    );
  }, [selectedDeviceId]);

  const leaveRoom = useCallback(() => {
    SocketService.leaveRoom();

    if (myAudioRef.current) {
      myAudioRef.current.getTracks().forEach((track) => track.stop());
      myAudioRef.current = null;
    }

    PeerService.disconnect();

    setAudioStreams(undefined);
    setMuteStates({});
    setShowVoip(false);
    navigate("/");
  }, []);

  const addAudioStream = useCallback((name: string, stream: MediaStream) => {
    if (name)
      setAudioStreams((prev) => ({
        ...prev,
        [name]: stream,
      }));
  }, []);

  const removeAudioStream = useCallback((name: string) => {
    setAudioStreams((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  }, []);

  const toggleMute = useCallback(
    (targetPlayerName: string) => {
      const playerName = PlayerService.getPlayerName();
      if (!playerName) return;

      if (targetPlayerName === playerName) {
        const stream = myAudioRef.current;
        if (!stream) return;

        const track = stream.getAudioTracks()[0];
        const isMuted = muteStates[playerName];

        if (!track && isMuted) {
          navigator.mediaDevices
            .getUserMedia({
              audio: selectedDeviceId
                ? { deviceId: { exact: selectedDeviceId } }
                : true,
            })
            .then((newStream) => {
              const newTrack = newStream.getAudioTracks()[0];
              stream.addTrack(newTrack);
              myAudioRef.current = stream;
              setMuteStates((prev) => ({ ...prev, [playerName]: false }));
            });
        } else if (!isMuted && track) {
          track.stop();
          stream.removeTrack(track);
          setMuteStates((prev) => ({ ...prev, [playerName]: true }));
        } else {
          const stream = audioStreams?.[targetPlayerName];
          if (stream instanceof MediaStream) {
            const audioElement = Array.from(
              document.querySelectorAll("audio")
            ).find((audio) => audio.srcObject === stream);

            if (audioElement) {
              const isMuted = !audioElement.muted;
              audioElement.muted = isMuted;
              setMuteStates((prev) => ({
                ...prev,
                [targetPlayerName]: isMuted,
              }));
            }
          }
        }
      }
    },
    [audioStreams, muteStates, selectedDeviceId]
  );

  const voipContextValue = useMemo(() => ({
    joinRoom,
    leaveRoom,
    users: SocketService.socketUsers.get(),
    audioStreams,
    muteStates,
    toggleMute,
    myAudioRef,
    showVoip,
    setShowVoip,
  }), [
    joinRoom,
    leaveRoom,
    audioStreams,
    muteStates,
    toggleMute,
    showVoip,
    version
  ]);

  return (
    <VoipContext.Provider
      value={voipContextValue}
    >
      {children}
    </VoipContext.Provider>
  );
};
