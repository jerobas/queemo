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
import { reactive } from "../utils/reactive";

class SocketService {
    private socket: Socket;
    private roomId: string | null = null;
    socketUsers = reactive<IPlayer[]>([]);
    inRoom = reactive(false);  

    constructor() {
        this.socket = io(AWS.SOCKET, {
            autoConnect: false,
        });
    }

    connect() {
        console.log("connect")
        this.socket.connect();
    }

    disconnect() {
        this.socket.removeAllListeners();
        this.socket.disconnect();
    }

    setRoomId(roomId: string | null) {
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
            playerName: PlayerService.getPlayerName(),
            peerId,
            summonerId: PlayerService.getSummonerId(), })
        // }, () => this.onJoiningRoom(
        //     teams,
        //     connectToUsers,
        //     removeAudioStream
        // ));

        this.onJoiningRoom(
            teams,
            connectToUsers,
            removeAudioStream
        )
    }

    onJoiningRoom(
        teams: Teams,
        connectToUsers: (players: IPlayer[]) => void,
        removeAudioStream: (name: string) => void,
    ) {
        this.inRoom.set(true)

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

            this.socketUsers.set(uniquePlayers);
            connectToUsers(uniquePlayers);
        });

        this.socket.on("playerDisconnected", (summonerId: string) => {
            let newUsers = [...this.socketUsers.get()]
            const disconnectedUser = pullOne(newUsers, (user) => user.summonerId === summonerId);

            if (disconnectedUser) {
                removeAudioStream(disconnectedUser.name);
                this.socketUsers.set(newUsers)
            }
        });
    }

    leaveRoom() {
        this.socket.emit("leaveRoom", {
            roomId: this.roomId,
            playerName: PlayerService.getPlayerName(),
        });
        this.removeAllListeners();

        this.inRoom.set(false)
        this.inRoom.clear()
        
        this.socketUsers.set([])
        this.socketUsers.clear()

        this.disconnect()
    }
}

export default new SocketService();

