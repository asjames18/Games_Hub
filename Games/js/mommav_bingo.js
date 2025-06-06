document.addEventListener('DOMContentLoaded', function() {
    let boardContent = [];
    let calledItems = [];
    let autoPlayInterval = null;
    let isAutoPlaying = false;
    let gameStartTime = null;
    let currentGameMode = GAME_MODES.CLASSIC;
    let gameStats = new GameStats();
    let soundEnabled = true;
    
    // Initialize audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};
    
    // Shuffle array function
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // Load sound effects
    function loadSounds() {
        Object.entries(SOUND_EFFECTS).forEach(([key, path]) => {
            fetch(path)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    sounds[key] = audioBuffer;
                })
                .catch(error => {
                    console.warn(`Failed to load sound ${key}:`, error);
                });
        });
    }
    
    // Play sound effect
    function playSound(soundKey) {
        if (!soundEnabled || !sounds[soundKey]) return;
        
        const source = audioContext.createBufferSource();
        source.buffer = sounds[soundKey];
        source.connect(audioContext.destination);
        source.start(0);
    }
    
    // Update timer display
    function updateTimer() {
        if (!gameStartTime || !currentGameMode.timeLimit) return;
        
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const remaining = currentGameMode.timeLimit - elapsed;
        
        if (remaining <= 0) {
            endGame(false);
            return;
        }
        
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // End game
    function endGame(won) {
        const gameTime = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : null;
        
        gameStats.updateStats({
            won,
            mode: currentGameMode.name,
            time: gameTime,
            calls: calledItems.length
        });
        
        if (won) {
            playSound('WIN');
            showWinMessage();
            triggerConfetti();
        } else {
            playSound('ERROR');
            alert("Time's up! Better luck next time!");
        }
        
        if (isAutoPlaying) {
            toggleAutoPlay();
        }
        
        gameStartTime = null;
        updateStatsDisplay();
    }
    
    // Show win message with stats
    function showWinMessage() {
        const winMessage = document.getElementById('winMessage');
        const stats = gameStats.getStats();
        
        document.getElementById('winStats').innerHTML = `
            <p>Time: ${Math.floor((Date.now() - gameStartTime) / 1000)} seconds</p>
            <p>Calls: ${calledItems.length}</p>
            <p>Mode: ${currentGameMode.name}</p>
        `;
        
        winMessage.classList.remove('hidden');
    }
    
    // Update stats display
    function updateStatsDisplay() {
        const stats = gameStats.getStats();
        document.getElementById('statsDisplay').innerHTML = `
            <div class="text-center">
                <p>Games Played: ${stats.gamesPlayed}</p>
                <p>Games Won: ${stats.gamesWon}</p>
                ${stats.fastestWin ? `<p>Fastest Win: ${stats.fastestWin} seconds</p>` : ''}
                ${stats.fewestCalls ? `<p>Fewest Calls: ${stats.fewestCalls}</p>` : ''}
            </div>
        `;
    }
    
    // Trigger confetti animation
    function triggerConfetti() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            // Generate confetti particles
            for (let i = 0; i < particleCount; i++) {
                const x = randomInRange(0, window.innerWidth);
                const y = randomInRange(0, window.innerHeight);
                const particle = document.createElement('div');
                particle.className = 'confetti';
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
                document.body.appendChild(particle);
                
                setTimeout(() => particle.remove(), 1000);
            }
        }, 250);
    }
    
    // Set game mode
    function setGameMode(mode) {
        currentGameMode = GAME_MODES[mode];
        document.getElementById('gameMode').textContent = currentGameMode.name;
        document.getElementById('gameModeDescription').textContent = currentGameMode.description;
        
        if (currentGameMode.timeLimit) {
            document.getElementById('timer').classList.remove('hidden');
        } else {
            document.getElementById('timer').classList.add('hidden');
        }
        
        generateBingoBoard();
    }
    
    // Modified generateBingoBoard function
    function generateBingoBoard() {
        const bingoGrid = document.getElementById('bingoGrid');
        bingoGrid.innerHTML = '';
        
        // Reset game state
        calledItems = [];
        document.getElementById('calledItems').innerHTML = '';
        document.getElementById('callIcon').textContent = '🎮';
        document.getElementById('callText').textContent = 'Press "Call Item" to start!';
        
        // Stop auto play if it's running
        if (isAutoPlaying) {
            toggleAutoPlay();
        }
        
        // Start timer for timed modes
        if (currentGameMode.timeLimit) {
            gameStartTime = Date.now();
            setInterval(updateTimer, 1000);
        }
        
        // Shuffle and get 24 items (leaving space for FREE in the middle)
        const shuffledContent = shuffleArray([...bingoContent]);
        boardContent = [];
        
        // Fill the board content with 24 items, ensuring FREE space is in the middle
        let nonFreeItems = shuffledContent.filter(item => !item.isFreeSpace);
        nonFreeItems = nonFreeItems.slice(0, 24); // Ensure we only take 24 items
        
        for (let i = 0; i < 25; i++) {
            if (i === 12) { // Middle position (0-indexed)
                boardContent.push(bingoContent.find(item => item.isFreeSpace));
            } else {
                boardContent.push(nonFreeItems.pop());
            }
        }
        
        // Create the grid
        for (let i = 0; i < 25; i++) {
            const item = boardContent[i];
            const square = document.createElement('div');
            square.className = `bingo-square flex flex-col items-center justify-center p-2 aspect-square text-center ${item.isFreeSpace ? 'free-space selected' : ''}`;
            square.dataset.index = i;
            
            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.textContent = item.icon;
            
            const text = document.createElement('div');
            text.className = 'text-xs sm:text-sm font-medium';
            text.textContent = item.text;
            
            square.appendChild(icon);
            square.appendChild(text);
            
            // Add click event to toggle selection
            square.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
            
            bingoGrid.appendChild(square);
        }
    }
    
    // Modified callItem function
    function callItem() {
        playSound('CALL');
        
        // If all items have been called, reset
        if (calledItems.length >= bingoContent.length - 1) { // -1 for FREE space
            alert("All items have been called! Starting over.");
            calledItems = [];
            document.getElementById('calledItems').innerHTML = '';
        }
        
        // Find an item that hasn't been called yet
        let availableItems = bingoContent.filter(item => 
            !item.isFreeSpace && !calledItems.some(called => called.text === item.text)
        );
        
        if (availableItems.length === 0) {
            return;
        }
        
        // Select a random item
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const calledItem = availableItems[randomIndex];
        
        // Update the current call display
        document.getElementById('callIcon').textContent = calledItem.icon;
        document.getElementById('callText').textContent = calledItem.text;
        
        // Add to called items list
        calledItems.unshift(calledItem);
        
        // Update the called items display
        updateCalledItemsDisplay();
        
        // Highlight the square on the board if it exists
        highlightCalledSquare(calledItem);
        
        // Speak the called item
        speakCalledItem(calledItem);
    }
    
    function updateCalledItemsDisplay() {
        const calledItemsContainer = document.getElementById('calledItems');
        calledItemsContainer.innerHTML = '';
        
        calledItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `called-item p-2 rounded-md mb-2 flex items-center ${index === 0 ? 'current-call' : ''}`;
            
            const iconElement = document.createElement('span');
            iconElement.className = 'text-xl mr-2';
            iconElement.textContent = item.icon;
            
            const textElement = document.createElement('span');
            textElement.textContent = item.text;
            
            itemElement.appendChild(iconElement);
            itemElement.appendChild(textElement);
            calledItemsContainer.appendChild(itemElement);
        });
    }
    
    function highlightCalledSquare(calledItem) {
        const squares = document.querySelectorAll('.bingo-square');
        
        squares.forEach(square => {
            const index = parseInt(square.dataset.index);
            if (boardContent[index] && boardContent[index].text === calledItem.text) {
                square.classList.add('called');
                setTimeout(() => {
                    square.classList.remove('called');
                }, 2000);
            }
        });
    }
    
    function speakCalledItem(item) {
        // Create Momma V's sayings to announce the item
        const sayings = [
            `${item.text}! You heard me, ${item.text}!`,
            `Next up is ${item.text}, y'all!`,
            `${item.text}! Mark it if you got it!`,
            `Momma V says ${item.text}!`,
            `Listen up now, ${item.text}!`
        ];
        
        const randomSaying = sayings[Math.floor(Math.random() * sayings.length)];
        
        // Use speech synthesis if available
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance(randomSaying);
            speech.rate = 0.9;
            speech.pitch = 1.1;
            window.speechSynthesis.speak(speech);
        }
    }
    
    // Check for bingo win conditions
    function checkForBingo() {
        const squares = document.querySelectorAll('.bingo-square');
        const selectedIndices = Array.from(squares)
            .filter(square => square.classList.contains('selected'))
            .map(square => parseInt(square.dataset.index));
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            const rowIndices = [row*5, row*5+1, row*5+2, row*5+3, row*5+4];
            if (rowIndices.every(index => selectedIndices.includes(index))) {
                return true;
            }
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            const colIndices = [col, col+5, col+10, col+15, col+20];
            if (colIndices.every(index => selectedIndices.includes(index))) {
                return true;
            }
        }
        
        // Check diagonals
        const diagonal1 = [0, 6, 12, 18, 24];
        const diagonal2 = [4, 8, 12, 16, 20];
        
        if (diagonal1.every(index => selectedIndices.includes(index)) ||
            diagonal2.every(index => selectedIndices.includes(index))) {
            return true;
        }
        
        return false;
    }
    
    function toggleAutoPlay() {
        const autoPlayBtn = document.getElementById('autoPlayBtn');
        
        if (isAutoPlaying) {
            clearInterval(autoPlayInterval);
            autoPlayBtn.textContent = 'Auto Play: OFF';
            autoPlayBtn.classList.remove('bg-[#FF4500]');
            autoPlayBtn.classList.add('bg-[#4169E1]');
            isAutoPlaying = false;
        } else {
            autoPlayInterval = setInterval(callItem, 3000);
            autoPlayBtn.textContent = 'Auto Play: ON';
            autoPlayBtn.classList.remove('bg-[#4169E1]');
            autoPlayBtn.classList.add('bg-[#FF4500]');
            isAutoPlaying = true;
            
            // Call the first item immediately
            callItem();
        }
    }
    
    // Modified autoMarkSquares function
    function autoMarkSquares() {
        if (calledItems.length === 0) return;
        
        const latestCall = calledItems[0];
        const squares = document.querySelectorAll('.bingo-square');
        
        squares.forEach(square => {
            const index = parseInt(square.dataset.index);
            if (boardContent[index] && boardContent[index].text === latestCall.text) {
                square.classList.add('selected');
                playSound('MARK');
            }
        });
        
        // Check for bingo after marking
        if (checkForBingo()) {
            endGame(true);
        }
    }
    
    // Event listeners
    document.getElementById('newGameBtn').addEventListener('click', generateBingoBoard);
    
    document.getElementById('callItemBtn').addEventListener('click', function() {
        callItem();
        if (currentGameMode.autoMark) {
            autoMarkSquares();
        }
    });
    
    document.getElementById('checkBingoBtn').addEventListener('click', function() {
        if (checkForBingo()) {
            endGame(true);
        } else {
            alert("Not quite yet, honey! Keep marking those squares!");
        }
    });
    
    document.getElementById('closeWinBtn').addEventListener('click', function() {
        document.getElementById('winMessage').classList.add('hidden');
    });
    
    document.getElementById('autoPlayBtn').addEventListener('click', toggleAutoPlay);
    
    // Add event listeners for new features
    document.getElementById('toggleSound').addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        this.textContent = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    });
    
    document.getElementById('resetStats').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all statistics?')) {
            gameStats.resetStats();
            updateStatsDisplay();
        }
    });
    
    // Add game mode buttons
    Object.keys(GAME_MODES).forEach(mode => {
        const button = document.createElement('button');
        button.className = 'btn bg-[#CD853F] hover:bg-[#8B4513] text-white font-bold py-2 px-6 rounded-full';
        button.textContent = GAME_MODES[mode].name;
        button.addEventListener('click', () => setGameMode(mode));
        document.getElementById('gameModes').appendChild(button);
    });
    
    // Initialize the game
    loadSounds();
    generateBingoBoard();
    updateStatsDisplay();
    setGameMode('CLASSIC');
}); 