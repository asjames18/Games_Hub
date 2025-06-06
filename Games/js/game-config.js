const GAME_MODES = {
    CLASSIC: {
        name: 'Classic',
        description: 'Traditional bingo with no time limit',
        timeLimit: null,
        autoMark: false
    },
    SPEED: {
        name: 'Speed',
        description: 'Race against time to get bingo!',
        timeLimit: 180, // 3 minutes
        autoMark: true
    },
    CHALLENGE: {
        name: 'Challenge',
        description: 'Get bingo with the fewest calls possible',
        timeLimit: null,
        autoMark: false,
        trackCalls: true
    }
};

const SOUND_EFFECTS = {
    CALL: 'sounds/call.mp3',
    MARK: 'sounds/mark.mp3',
    WIN: 'sounds/win.mp3',
    ERROR: 'sounds/error.mp3'
};

const STATS_DEFAULTS = {
    gamesPlayed: 0,
    gamesWon: 0,
    fastestWin: null,
    fewestCalls: null,
    totalPlayTime: 0,
    winHistory: []
}; 