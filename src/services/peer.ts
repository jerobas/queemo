import Peer, { MediaConnection, PeerOptions } from "peerjs";
import {
    AWS,
    IPlayer,
} from "../interfaces";

class PeerService {
    private peer: Peer;

    constructor() {
        this.peer = new (Peer as new (id: string | undefined, options?: PeerOptions) => Peer)(
            undefined,
            {
                host: AWS.PEER as string,
                port: AWS.PERR_PORT as number,
                path: AWS.PATH as string,
            }
        );
    }

    initialize(callCallback: (call: MediaConnection) => void, openCallback: (id: string) => void) {
        this.peer.on("open", (id: string) => {
            openCallback(id);
        });
        this.peer.on("call", callCallback);
    }

    connectToUser(
        player: IPlayer,
        playerName: string,
        myAudioRef: React.RefObject<MediaStream>,
        addAudioStream: (name: string, stream: MediaStream) => void,
        removeAudioStream: (name: string) => void
    ) {
        const call = this.peer.call(
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
        Object.values(this.peer.connections).forEach(
            (connectionArray) => {
                connectionArray.forEach((connection: any) => {
                    if (connection.close) connection.close();
                });
            }
        );
        this.peer.disconnect();
        this.peer.destroy();
        //}
    }
}

export default new PeerService();