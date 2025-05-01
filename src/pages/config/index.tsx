import { useAudioInput } from "../../context/audioContext";
import { useAutoJoin } from "../../context/autoJoinContext";

const Config = () => {
  const { selectedDeviceId, storeDeviceId, availableDevices } = useAudioInput();
  const { autoJoinCall, toggleAutoJoinCall } = useAutoJoin();

  return (
    <div className="overflow-y-auto p-4 flex flex-col items-center justify-center">
      <label className="text-sm font-medium text-gray-700 mb-2 self-start">
        Selecione seu microfone
      </label>
      <select
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selectedDeviceId || ""}
        onChange={(e) => storeDeviceId(e.target.value)}
      >
        {availableDevices.map((device: any) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || ""}
          </option>
        ))}
      </select>

      <span className="text-sm font-medium text-gray-700 mt-6 mb-2 self-start">
        Auto Join
      </span>
      <div className="w-full flex justify-between items-center">
        <span className="text-sm text-gray-600">Desativado</span>
        <button
          onClick={toggleAutoJoinCall}
          className={`relative w-14 h-7 flex items-center rounded-full transition-colors duration-300 ${
            autoJoinCall ? "bg-green-500" : "bg-gray-400"
          }`}
        >
          <div
            className={`absolute left-1 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
              autoJoinCall ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-gray-600">Ativado</span>
      </div>
    </div>
  );
};
export default Config;
