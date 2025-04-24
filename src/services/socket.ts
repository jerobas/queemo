import io, { Socket as SocketIOClient } from "socket.io-client";

import {
    AWS,
    IPlayer,
    Teams
} from "../interfaces";
import { pullOne } from "../utils";

import { SOCKET_SERVER_EVENTS, SOCKET_CLIENT_EVENTS } from "../../shared/main.ts"

import PlayerService from "./player";
import { reactive } from "../utils/reactive";
import { findMatchingPlayer, generateUniquePlayers } from "./room";

type Handler = (params: any) => void;
type Emitter = (params: any) => void

class SocketService {
    private socket: SocketIOClient = io(AWS.SOCKET, {
        autoConnect: false,
    });

    private roomId: string | null = null;
    socketUsers = reactive<IPlayer[]>([]);
    inRoom = reactive(false);

    private eventHandlers: Record<SOCKET_CLIENT_EVENTS, Handler> = {
        [SOCKET_CLIENT_EVENTS.USER_JOINED]: this._onUserJoined,
        [SOCKET_CLIENT_EVENTS.USER_LEFT]: this._onUserLeft,
    };

    private eventEmitters: Record<SOCKET_SERVER_EVENTS, Emitter> = {
        [SOCKET_SERVER_EVENTS.DISCONNECT]: this.disconnect,
        [SOCKET_SERVER_EVENTS.USER_JOIN]: ({ peerId, callback }: { peerId: string, callback: (players: IPlayer[]) => void }) => this.socket.emit(
            SOCKET_SERVER_EVENTS.USER_JOIN,
            {
                peerId,
                roomId: this.roomId,
                summonerId: PlayerService.getSummonerId(),
                playerName: PlayerService.getPlayerName()
            },
            callback
        ),
        [SOCKET_SERVER_EVENTS.USER_LEAVE]: (callback: () => void) => this.socket.emit(
            SOCKET_SERVER_EVENTS.USER_LEAVE,
            {
                roomId: this.roomId,
                playerName: PlayerService.getPlayerName(),
            },
            callback
        ),
    }

    private emit<E extends SOCKET_SERVER_EVENTS>(
        event: E,
        data: Parameters<typeof this.eventEmitters[E]>[0]
    ) {
        this.eventEmitters[event]?.(data);
    }

    connect() { this.socket.connect(); }

    disconnect() {
        this.socket.removeAllListeners();
        this.socket.disconnect();
    }

    setRoomId(roomId: string | null) { this.roomId = roomId; }

    joinRoom(
        peerId: string,
        ...callbackParams: [Teams, (players: IPlayer[]) => void, (name: string) => void]
    ) {
        this.emit(SOCKET_SERVER_EVENTS.USER_JOIN, {
            peerId,
            callback: (players: IPlayer[]) => this._joinRoomCallback(...callbackParams, players)
        });
    }

    private _onUserJoined({
        player,
        teams
    }: {
        player: IPlayer,
        teams: Teams
    }) {
        if (this.socketUsers.get().find(e => e.summonerId === player.summonerId))
            return

        const matchingPlayer = findMatchingPlayer(teams, player)
        const updatedPlayers = [
            ...this.socketUsers.get(),
            matchingPlayer
        ]

        this.socketUsers.set(updatedPlayers);
    }

    private _onUserLeft({
        summonerId,
        removeAudioStream
    }: {
        summonerId: string,
        removeAudioStream: (name: string) => void
    }) {
        let newUsers = [...this.socketUsers.get()]
        const disconnectedUser = pullOne(newUsers, (user) => user.summonerId === summonerId);

        if (disconnectedUser) {
            removeAudioStream(disconnectedUser.name);
            this.socketUsers.set(newUsers)
        }
    }

    private _joinRoomCallback(
        teams: Teams,
        connectToUsers: (players: IPlayer[]) => void,
        removeAudioStream: (name: string) => void,
        players: IPlayer[]
    ) {
        this.inRoom.set(true)

        const uniquePlayers = generateUniquePlayers(teams, players)
        this.socketUsers.set(uniquePlayers)
        connectToUsers(uniquePlayers)

        this.socket.on(SOCKET_CLIENT_EVENTS.USER_JOINED, (player: IPlayer) =>
            this.eventHandlers[SOCKET_CLIENT_EVENTS.USER_JOINED]({ player, teams }));

        this.socket.on(SOCKET_CLIENT_EVENTS.USER_LEFT, (summonerId: string) =>
            this.eventHandlers[SOCKET_CLIENT_EVENTS.USER_LEFT]({ summonerId, removeAudioStream }));
    }

    leaveRoom() { this.emit(SOCKET_SERVER_EVENTS.USER_LEAVE, this._leaveRoomCallback) }

    private _leaveRoomCallback() {
        this.inRoom.set(false)
        this.socketUsers.set([])
        this.disconnect()
    }
}

export default new SocketService();