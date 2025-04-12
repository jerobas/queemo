import io, { Socket } from "socket.io-client";

import {
    AWS,
    IPlayer,
    Teams
} from "../interfaces";
import { pullOne } from "../utils";

// enum SocketEvents {
//     JOIN_ROOM = "joinRoom",
//     LEAVE_ROOM = "leaveRoom",
//     USER_JOINED = "userJoined",
//     PLAYER_DISCONNECTED = "playerDisconnected",
// }

import PlayerService from "./player";

class SocketService {
    private socket: Socket;
    private roomId: string | null = null;
    private socketUsers: IPlayer[] = [];
    private playerName: string | null = null;
    private inRoom: boolean = false;

    constructor() {
        this.socket = io(AWS.SOCKET, {
            autoConnect: false,
        });
    }

    connect() {
        this.socket.connect();
    }

    disconnect() {
        this.socket.removeAllListeners();
        this.socket.disconnect();
    }

    setPlayerName(name: string) {
        this.playerName = name;
    }

    getPlayerName() {
        return this.playerName;
    }

    getSocketUsers() {
        return this.socketUsers;
    }

    isInRoom() {
        return this.inRoom;
    }

    setRoomId(roomId: string) {
        this.roomId = roomId;
    }

    removeAllListeners() {
        this.socket.removeAllListeners();
    }

    joinRoom(
        peerId: string,
        teams: Teams,
        connectToUsers: (players: IPlayer[]) => void,
        removeAudioStream: (name: string) => void,
    ) {
        this.socket.emit("joinRoom", {
            roomId: this.roomId,
            playerName: this.playerName,
            peerId,
            summonerId: PlayerService.getSummonerId(),
        });

        this.inRoom = true;

        this.socket.on("userJoined", (players: IPlayer[]) => {
            const updatedPlayers = players.map((player) => {
                const matchingPlayer = [...teams.teamOne, ...teams.teamTwo].find(
                    (teamPlayer) => teamPlayer.summonerId === player.summonerId
                );

                return {
                    ...player,
                    iconUrl: matchingPlayer ? matchingPlayer.championIcon : null,
                };
            });

            const uniquePlayers = Array.from(
                new Map(updatedPlayers.map((p) => [p.summonerId, p])).values()
            );

            this.socketUsers = uniquePlayers;
            connectToUsers(uniquePlayers);
        });

        this.socket.on("playerDisconnected", (summonerId: string) => {
            const disconnectedUser = pullOne(this.socketUsers, (user) => user.summonerId === summonerId);

            if (disconnectedUser) {
                removeAudioStream(disconnectedUser.name);
            }
        });
    }

    leaveRoom() {
        this.socket.emit("leaveRoom", {
            roomId: this.roomId,
            playerName: this.playerName,
        });
        this.removeAllListeners();
        this.inRoom = false;
        this.roomId = null;
        this.playerName = null;
        this.socketUsers = [];
    }
}

export default new SocketService();

