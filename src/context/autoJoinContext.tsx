import React, { createContext, useContext, useEffect, useState } from "react";
import { ipc } from "../utils";
import { IpcMethod } from "../interfaces";

interface IAutoJoinCallContext {
  autoJoinCall: boolean;
  toggleAutoJoinCall: () => void;
}

const autoJoinCallContext = createContext<IAutoJoinCallContext>({
  autoJoinCall: false,
  toggleAutoJoinCall: () => {},
});

export const AutoJoinCallProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [autoJoinCall, setAutoJoinCall] = useState(false);

  const loadAutoJoin = async () => {
    const value = await ipc(IpcMethod.GET_AUTO_JOIN_CALL, "");
    setAutoJoinCall(value);
  };

  const toggleAutoJoinCall = () => {
    const newValue = !autoJoinCall;
    setAutoJoinCall(newValue);
    ipc(IpcMethod.SET_AUTO_JOIN_CALL, newValue);
  };

  useEffect(() => {
    loadAutoJoin();
  }, []);

  return (
    <autoJoinCallContext.Provider value={{ autoJoinCall, toggleAutoJoinCall }}>
      {children}
    </autoJoinCallContext.Provider>
  );
};

export const useAutoJoin = () => useContext(autoJoinCallContext);
