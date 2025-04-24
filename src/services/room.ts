import { IPlayer, Teams } from "../interfaces";

type FindMatchingPlayerType = (teams: Teams, player: IPlayer) => IPlayer
type FindMatchingPlayersType = (teams: Teams, players: IPlayer[]) => IPlayer[]

export const findMatchingPlayer: FindMatchingPlayerType = (teams, player) => {
    const matchingPlayer = [...teams.teamOne, ...teams.teamTwo].find(
        (teamPlayer) => teamPlayer.summonerId === player.summonerId
    );

    return {
        ...player,
        iconUrl: matchingPlayer ? matchingPlayer.championIcon : null,
    };
}

export const findMatchingPlayers: FindMatchingPlayersType = (teams, players) =>
    players.map((player) => findMatchingPlayer(teams, player));

export const generateUniquePlayers: FindMatchingPlayersType = (teams, players) => {
    const updatedPlayers = findMatchingPlayers(teams, players)

    return Array.from(
        new Map(updatedPlayers.map((p) => [p.summonerId, p])).values()
    );
}