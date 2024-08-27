document.getElementById("start-game").addEventListener("click", startGame);

let deck = [];
let players = [ // player constructors
    { name: "Player 1", hand: [] },
    { name: "Player 2", hand: [] }
];

document.getElementById("initial-pairs-removed-button").addEventListener("click", () => {

    // Show the "Ready" button and hide the "Initial pairs removed" button
    document.getElementById("initial-pairs-removed-button").style.display = "none";
    document.getElementById("ready-button").style.display = "inline-block";
    bot_removePairs();
    updateGameLog("Initial pairs removed. Players are ready to start the game.");
});

let currentPlayerIndex = 0;  // Start with Player 1

function startGame() {
    // Hide game title and start game button
    document.getElementById("game-title").style.display = "none"; //"none --> hidden"
    document.getElementById("start-game").style.display = "none";

    initializeDeck();
    shuffleDeck();
    dealCards();
    displayHands();

    // Show the arrow now that the game has started
    document.getElementById('turn-indicator').style.display = 'block';
    // document.getElementById('ready-button').style.display = "inline-block";
    document.getElementById("initial-pairs-removed-button").style.display = "inline-block";

    updateGameLog("The game has started. Cards have been dealt.");
}

document.getElementById("ready-button").addEventListener("click", () => {
    // Hide the ready button after it's clicked
    document.getElementById("ready-button").style.display = "none";
    
    // Proceed with removing pairs and starting the game
    bot_takeCard();
    updateTurnIndicator();
    updateGameLog("Players have removed pairs. The game is now starting.");
});

// For "How to Play" Pop-up
document.getElementById("how-to-play").addEventListener("click", function() {
    document.getElementById("how-to-play-popup").style.display = "block";
});

document.getElementById("close-popup").addEventListener("click", function() {
    document.getElementById("how-to-play-popup").style.display = "none";
});

function initializeDeck() {
    deck = [];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

    // Create the deck (removing exactly 1 queen)
    for (let suit of suits) {
        for (let value of values) {
            if (!(suit === 'hearts' && value === 'queen')) { // Old Maid (one Queen removed)
                let imageName = `${value}_of_${suit}.png`;  // Construct the image filename
                deck.push({ value: value, suit: suit, image: imageName });
            }
        }
    }
}

function shuffleDeck() {
    // Simple shuffle algorithm (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards() {
    // Distribute cards to players
    let currentPlayer = 0;
    while (deck.length > 0) {
        players[currentPlayer].hand.push(deck.pop());
        currentPlayer = (currentPlayer + 1) % players.length;
    }
}

let firstCard = null;
let firstCardIndex = null;
let highlightedCardButton = null; // Track the currently highlighted card button

function handleCardClick(cardIndex) {
    const selectedCard = players[0].hand[cardIndex]; // Only handle Player 1's clicks

    // Prevent selecting the same card twice
    if (firstCard !== null && firstCardIndex === cardIndex) {
        updateGameLog("You cannot select the same card twice.");
        return;
    }

    if (firstCard === null) {
        // First card selected
        firstCard = selectedCard;
        firstCardIndex = cardIndex;

        // Highlight the selected card button
        const cardButtons = document.querySelectorAll("#player1 .card-button");
        cardButtons.forEach(button => button.classList.remove("highlighted")); // Remove highlight from all buttons
        cardButtons[cardIndex].classList.add("highlighted");
        highlightedCardButton = cardButtons[cardIndex];
    } else {
        // Second card selected
        if (firstCard.value === selectedCard.value) {
            // Replace the matched cards with null
            players[0].hand[firstCardIndex] = null;
            players[0].hand[cardIndex] = null;

            // Create a new array excluding null values
            players[0].hand = players[0].hand.filter(card => card !== null);

            // Redraw hands after removing pairs
            displayHands();

            updateGameLog(`Player 1 removed a pair of ${selectedCard.value}s.`);
        } else {
            updateGameLog(`Player 1 tried to remove ${firstCard.value} and ${selectedCard.value}, but they don't match.`);
        }

        // Reset selection and highlight
        firstCard = null;
        firstCardIndex = null;

        if (highlightedCardButton) {
            highlightedCardButton.classList.remove("highlighted");
            highlightedCardButton = null;
        }
    }
}


function displayHands() {
    // Get the player containers
    const player1Container = document.getElementById("player1");
    const player2Container = document.getElementById("player2");

    // Clear previous hands if any
    player1Container.innerHTML = '';
    player2Container.innerHTML = '';

    // Display Player 1's name
    const player1NameDiv = document.createElement("div");
    player1NameDiv.classList.add("player-name");
    player1NameDiv.innerText = players[0].name;
    player1Container.appendChild(player1NameDiv);

    // Display Player 1's hand
    players[0].hand.forEach((card, index) => {
        const cardButton = document.createElement("button");
        cardButton.classList.add("card-button");
        cardButton.innerHTML = `<img src="images/cards/${card.image}" class="card" />`;
        cardButton.addEventListener("click", () => handleCardClick(index));
        player1Container.appendChild(cardButton);
    });

    // Display Player 2's name
    const player2NameDiv = document.createElement("div");
    player2NameDiv.classList.add("player-name");
    player2NameDiv.innerText = players[1].name;
    player2Container.appendChild(player2NameDiv);

    // Display Player 2's hand
    players[1].hand.forEach(card => {
        const cardDiv = document.createElement("img");
        cardDiv.src = `images/cards/${card.image}`;  // Path to the image
        cardDiv.classList.add("card");
        player2Container.appendChild(cardDiv);
    });
}

function updateTurnIndicator() {
    const turnArrow = document.getElementById('turn-arrow');
    
    // If it's Player 1's turn, point the arrow up, otherwise point it down 
    if (currentPlayerIndex === 0) {
        turnArrow.style.transform = 'rotate(0deg)';
    } else {
        turnArrow.style.transform = 'rotate(180deg)';
    }
}

function nextTurn() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateTurnIndicator();
    updateGameLog(`It's now ${players[currentPlayerIndex].name}'s turn.`);
}

/* --------------- BOT COMMANDS -----------------*/
function bot_removePairs() {
    let botHand = players[1].hand;
    let botPairsRemoved = false;

    let i = 0;
    while (i < botHand.length) {
        let pairIndex = botHand.findIndex((card, index) => card && botHand[i] && card.value === botHand[i].value && index !== i);
        if (pairIndex !== -1) {
            updateGameLog(`Player 2 (Bot) removed a pair of ${botHand[i].value}s.`);
            botHand[i] = null;
            botHand[pairIndex] = null;
            botPairsRemoved = true;

            // Filter out the removed pairs and update bot's hand
            botHand = botHand.filter(card => card !== null);
            i = 0; // Restart the loop to check for any remaining pairs
        } else {
            i++;
        }
    }

    // Update Player 2's hand after removing pairs
    players[1].hand = botHand;

    // If pairs were removed, update the display
    if (botPairsRemoved) {
        displayHands();
    }
}

function bot_takeCard() {
    // Ensure there are cards for the bot to take
    if (players[0].hand.length === 0) {
        updateGameLog("Player 1 has no cards left to choose from.");
        return;
    }

    // Choose a random card from Player 1's hand
    const player1Hand = players[0].hand;
    const randomIndex = Math.floor(Math.random() * player1Hand.length);
    const chosenCard = player1Hand[randomIndex];

    // Remove the chosen card from Player 1's hand
    players[0].hand.splice(randomIndex, 1);

    // Add the chosen card to Player 2's hand (the bot)
    players[1].hand.push(chosenCard);

    // Check if the chosen card creates a pair for the bot
    bot_removePairs();

    // Redraw hands after the bot's turn
    displayHands();

    // Move the turn indicator back to Player 1
    currentPlayerIndex = 0;
    updateTurnIndicator();
    updateGameLog(`Player 2 (Bot) took a card from Player 1 and ${chosenCard.value}s.`);
}


// Game Logs
function updateGameLog(message) {
    const gameLog = document.getElementById("game-log");
    gameLog.innerText += message + '\n';
    gameLog.scrollTop = gameLog.scrollHeight;
}
