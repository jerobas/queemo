class PlayerService {
    private summonerId: string | null = null;
    private playerName: string | null = null;

    initialize(summonerId: string, playerName: string) {
        this.summonerId = summonerId;
        this.playerName = playerName;
    }

    getSummonerId() {
        return this.summonerId;
    }

    getPlayerName() {
        return this.playerName;
    }
}

export default new PlayerService();