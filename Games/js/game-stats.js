class GameStats {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        const savedStats = localStorage.getItem('mommavBingoStats');
        return savedStats ? JSON.parse(savedStats) : { ...STATS_DEFAULTS };
    }

    saveStats() {
        localStorage.setItem('mommavBingoStats', JSON.stringify(this.stats));
    }

    updateStats(gameResult) {
        this.stats.gamesPlayed++;
        
        if (gameResult.won) {
            this.stats.gamesWon++;
            
            // Update fastest win if applicable
            if (gameResult.time && (!this.stats.fastestWin || gameResult.time < this.stats.fastestWin)) {
                this.stats.fastestWin = gameResult.time;
            }
            
            // Update fewest calls if applicable
            if (gameResult.calls && (!this.stats.fewestCalls || gameResult.calls < this.stats.fewestCalls)) {
                this.stats.fewestCalls = gameResult.calls;
            }
            
            // Add to win history
            this.stats.winHistory.unshift({
                date: new Date().toISOString(),
                mode: gameResult.mode,
                time: gameResult.time,
                calls: gameResult.calls
            });
            
            // Keep only last 10 wins
            this.stats.winHistory = this.stats.winHistory.slice(0, 10);
        }
        
        if (gameResult.time) {
            this.stats.totalPlayTime += gameResult.time;
        }
        
        this.saveStats();
    }

    getStats() {
        return this.stats;
    }

    resetStats() {
        this.stats = { ...STATS_DEFAULTS };
        this.saveStats();
    }
} 