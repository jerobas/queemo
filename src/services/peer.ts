import Peer, { MediaConnection, PeerOptions } from "peerjs";
import {
    AWS,
    IPlayer,
} from "../interfaces";

class PeerService {
    private peer: Peer | null = null;
  
    getInstance(): Peer {
      if (!this.peer) throw new Error("Peer not initialized");
      return this.peer;
    }

    initialize(callCallback: (call: MediaConnection) => void, openCallback: (id: string) => void) {
        if (!this.peer) {
            this.peer = new (Peer as new (id: string | undefined, options?: PeerOptions) => Peer)(
                undefined,
                {
                    host: AWS.PEER as string,
                    port: AWS.PERR_PORT as number,
                    path: AWS.PATH as string,
                }
            );
            this.peer.on("open", (id: string) => {
                openCallback(id);
            });
            this.peer.on("call", callCallback);
        }
    }

    connectToUser(
        player: IPlayer,
        playerName: string,
        myAudioRef: React.RefObject<MediaStream>,
        addAudioStream: (name: string, stream: MediaStream) => void,
        removeAudioStream: (name: string) => void
    ) {
        console.log(playerName)
        const call = this.getInstance().call(
            player.peerId,
            myAudioRef.current!,
            {
                metadata: { playerName },
            }
        );
        call?.on("stream", (userStream: MediaStream) => {
            addAudioStream(player.name, userStream);
        });
        call?.on("close", () => {
            removeAudioStream(player.name);
        });
    }

    connectToUsers(
        players: IPlayer[],
        playerName: string,
        myAudioRef: React.RefObject<MediaStream>,
        addAudioStream: (name: string, stream: MediaStream) => void,
        removeAudioStream: (name: string) => void
    ) {
        for (const player of players) {
            this.connectToUser(
                player,
                playerName,
                myAudioRef,
                addAudioStream,
                removeAudioStream
            );
        }
    }

    disconnect() {
        //if (peerInstanceRef.current) {
        Object.values(this.getInstance().connections).forEach(
            (connectionArray) => {
                connectionArray.forEach((connection: any) => {
                    if (connection.close) connection.close();
                });
            }
        );
        this.getInstance().disconnect();
        this.getInstance().destroy();
        //}
    }
}

export default new PeerService();