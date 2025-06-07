import { IPlayer, Teams } from "../interfaces";

type FindMatchingPlayerType = (player: IPlayer) => IPlayer
type FindMatchingPlayersType = (players: IPlayer[]) => IPlayer[]

class RoomService {
    private static _teams: Teams;

    static set teams(teams: Teams) {
        this._teams = teams;
    }

    static get teams() {
        if (!this._teams) throw new Error("Teams not setted");
        return this._teams;
    }

    static findMatchingPlayer: FindMatchingPlayerType = (player) => {
        const teams = this.teams;

        const matchingPlayer = [...teams.teamOne, ...teams.teamTwo].find(
            (teamPlayer) => teamPlayer.summonerId === player.summonerId
        );

        return {
            ...player,
            iconUrl: matchingPlayer ? matchingPlayer.championIcon : null,
        };
    }

    static findMatchingPlayers: FindMatchingPlayersType = (players) =>
        players.map((player) => this.findMatchingPlayer(player));

    static generateUniquePlayers: FindMatchingPlayersType = (players) => {
        const updatedPlayers = this.findMatchingPlayers(players)

        return Array.from(
            new Map(updatedPlayers.map((p) => [p.summonerId, p])).values()
        );
    }
}

export default RoomService