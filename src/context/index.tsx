import { ToastProvider } from "./toastContext";
import { GameProvider } from "./gameContext";
import { VoipProvider } from "./voipContext";
import { AudioInputProvider } from "./audioContext";

const ContextWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <AudioInputProvider>
        <GameProvider>
          <VoipProvider>
            {children}
          </VoipProvider>
        </GameProvider>
      </AudioInputProvider>
    </ToastProvider>
  );
};

export default ContextWrapper;
