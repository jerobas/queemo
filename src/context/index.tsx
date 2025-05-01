import { ToastProvider } from "./toastContext";
import { GameProvider } from "./gameContext";
import { VoipProvider } from "./voipContext";
import { AudioInputProvider } from "./audioContext";
import { AutoJoinCallProvider } from "./autoJoinContext";

const ContextWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <AudioInputProvider>
        <GameProvider>
          <VoipProvider>
            <AutoJoinCallProvider>{children}</AutoJoinCallProvider>
          </VoipProvider>
        </GameProvider>
      </AudioInputProvider>
    </ToastProvider>
  );
};

export default ContextWrapper;
