import Peer, { PeerOptions } from "peerjs";
import { AWS, IPlayer } from "../interfaces";
import PlayerService from "./player.ts";
import { AudioService, MyStream } from "./audio.ts";

import SocketService from "./socket.ts";

class PeerService {
  private peer: Peer | null = null;

  getInstance(): Peer {
    if (!this.peer) throw new Error("Peer not initialized");
    return this.peer;
  }

  initialize() {
    if (!this.peer) {
      this.peer = new (Peer as new (
        id: string | undefined,
        options?: PeerOptions
      ) => Peer)(undefined, {
        host: AWS.PEER as string,
        port: AWS.PERR_PORT as number,
        path: AWS.PATH as string,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });
      this.peer.on("open", (id: string) => {
        SocketService.joinRoom(id);
      });
      this.peer.on("call", (call) => {
        const stream = MyStream.get();

        // Evita auto-chamada (loop)
        if (call.peer === this.peer?.id) {
          console.warn("Ignoring self-call");
          return;
        }

        // Evita responder mais de uma vez
        let alreadyAnswered = false;

        call.on("stream", (userStream: MediaStream) => {
          if (!alreadyAnswered) {
            alreadyAnswered = true;
            AudioService.addAudioStream(call.metadata.playerName, userStream);
          }
        });

        try {
          call.answer(stream);
        } catch (err) {
          console.error("Failed to answer call:", err);
        }

        call.on("error", (err) => {
          console.error("Call error:", err);
        });
      });
    }
  }

  connectToUser(player: IPlayer, playerName: string) {
    const myStream = MyStream.get();

    const call = this.getInstance().call(player.peerId, myStream, {
      metadata: { playerName },
    });
    call?.on("stream", (userStream: MediaStream) => {
      AudioService.addAudioStream(player.name, userStream);
    });
    call?.on("close", () => {
      AudioService.removeAudioStream(player.name);
    });
  }

  connectToUsers(players: IPlayer[]) {
    const playerName = PlayerService.getPlayerName();
    if (!playerName) throw new Error("No player name");

    for (const player of players) {
      this.connectToUser(player, playerName);
    }
  }

  disconnect() {
    //if (peerInstanceRef.current) {
    Object.values(this.getInstance().connections).forEach((connectionArray) => {
      connectionArray.forEach((connection: any) => {
        if (connection.close) connection.close();
      });
    });
    this.getInstance().disconnect();
    this.getInstance().destroy();
    //}
  }
}

export default new PeerService();
