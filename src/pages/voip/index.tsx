import { useVoip } from "../../context/voipContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import SocketService from '../../services/socket.ts'

const Voip = () => {
  const {
    joinRoom,
    users,
    audioStreams,
    muteStates,
    toggleMute,
    myAudioRef,
    showVoip,
  } = useVoip();

  console.log(muteStates)

  return (
    <div className="overflow-y-auto p-4 flex flex-col items-center justify-center">
      {!SocketService.inRoom.get() && showVoip ? (
        <button
          onClick={joinRoom}
          className="px-5 py-3 bg-green-600 text-white rounded-md cursor-pointer text-lg w-full box-border"
        >
          Entrar em Call
        </button>
      ) : (
        <div className="w-full max-w-md mt-5">
          <ul className="list-none p-0 text-left">
            {users.map((user) => {
              console.log(user); return (
                <li
                  key={user.summonerId}
                  className="mb-2 p-3 border border-gray-300 rounded-md flex justify-between items-center bg-gray-100 shadow"
                >
                  <div className="flex items-center">
                    {user?.iconUrl && (
                      <img
                        src={user?.iconUrl}
                        alt={`${user.name} icon`}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    )}
                    {user.name}
                  </div>
                  <button
                    onClick={() => toggleMute(user.name)}
                    className="bg-transparent border-none cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={
                        muteStates[user.name] ? faMicrophoneSlash : faMicrophone
                      }
                      className={`text-lg ${muteStates[user.name] ? "text-red-500" : "text-green-500"
                        }`}
                    />
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="flex flex-wrap justify-center gap-4 mt-5">
            <audio
              ref={(ref) => {
                if (ref && myAudioRef.current) {
                  ref.srcObject = myAudioRef.current;
                }
              }}
              muted
              autoPlay
              className="w-36 h-10 rounded-md shadow"
            />
            {audioStreams &&
              Object.keys(audioStreams).map((playerName) => {
                const stream = audioStreams[playerName];
                if (stream instanceof MediaStream) {
                  return (
                    <audio
                      key={playerName}
                      ref={(ref) => {
                        if (ref) {
                          ref.srcObject = stream;
                        }
                      }}
                      autoPlay
                      className="w-36 h-10 rounded-md shadow"
                    />
                  );
                }
                return null;
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Voip;
