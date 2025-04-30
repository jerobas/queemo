import React, { createContext, useState, useContext, useEffect } from "react";
import { ipc } from "../utils";
import { IpcMethod } from "../interfaces";
import { AudioService } from "../services/audio";

interface IAudioInputContext {
  selectedDeviceId: string | null;
  availableDevices: MediaDeviceInfo[];
  storeDeviceId: (id: string) => void;
}

const audioInputContext = createContext<IAudioInputContext>({
  selectedDeviceId: null,
  availableDevices: [],
  storeDeviceId: () => { },
});

export const AudioInputProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  );

  const storeDeviceId = (id: string) => {
    setSelectedDeviceId(id);
    ipc(IpcMethod.SET_AUDIO, id);
  };

  const loadDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );

      setAvailableDevices(audioInputs);

      const savedId = await ipc(IpcMethod.GET_AUDIO, "");

      if (savedId && audioInputs.some((d) => d.deviceId === savedId)) {
        setSelectedDeviceId(savedId);
      } else if (audioInputs.length > 0) {
        storeDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.log("Erro");
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId)
      AudioService.onSelectedDeviceChange(selectedDeviceId)
  }, [selectedDeviceId])

  return (
    <audioInputContext.Provider
      value={{ selectedDeviceId, storeDeviceId, availableDevices }}
    >
      {children}
    </audioInputContext.Provider>
  );
};

export const useAudioInput = () => {
  const context = useContext(audioInputContext);
  if (!context) console.log("sem ctx");
  return context;
};
