import Peer, { PeerOptions } from "peerjs";
import {
    AWS,
    IPlayer,
} from "../interfaces";
import PlayerService from "./player.ts"
import { AudioService, MyStream } from "./audio.ts";

import SocketService from "./socket.ts"

class PeerService {
    private peer: Peer | null = null;

    getInstance(): Peer {
        if (!this.peer) throw new Error("Peer not initialized");
        return this.peer;
    }

    initialize() {
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
                SocketService.joinRoom(
                    id,
                    (players) => this.connectToUsers(
                        players,
                        AudioService.addAudioStream,
                        AudioService.removeAudioStream
                    ),
                    AudioService.removeAudioStream
                );
            });
            this.peer.on("call", (call) => {
                const stream = MyStream.get()
                call.answer(stream);
                call.on("stream", (userStream: MediaStream) => {
                    AudioService.addAudioStream(call.metadata.playerName, userStream);
                });
            });
        }
    }

    connectToUser(
        player: IPlayer,
        playerName: string,
        addAudioStream: (name: string, stream: MediaStream) => void,
        removeAudioStream: (name: string) => void
    ) {
        const myStream = MyStream.get()

        const call = this.getInstance().call(
            player.peerId,
            myStream,
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
        addAudioStream: (name: string, stream: MediaStream) => void,
        removeAudioStream: (name: string) => void
    ) {
        const playerName = PlayerService.getPlayerName()
        if (!playerName) throw new Error("No player name")

        for (const player of players) {
            this.connectToUser(
                player,
                playerName,
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