const express = require('express')
const request = require('request');
const app = express()
const fetch = require("node-fetch");

const PORT = process.env.PORT || 8001;
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

http.listen(PORT, function (){
    console.log('Listening PORT: ' + PORT)
})

var lobbyData = require('./data/lobby.json');

let users = [
    {"id": "Klas", "nickname": "hasse", "score": 999},
    {"id": "Hasse", "nickname": "hagdfgfdgsse", "score": 2222},
    {"id": "Rogge", "nickname": "hkkkkk", "score": 32}
];

let lobby =
    {
        "id": "234",
        "gameName": "Uno",
        "players": [
            {
                "id": "Klas",
                "nickname": "Klas",
                "score": 999,
                "cards": []
            },
            {
                "id": "Hasse",
                "nickname": "Hasse",
                "score": 2222,
                "cards": []
            },
            {
                "id": "Rogge",
                "nickname": "Rogge",
                "score": 32,
                "cards": []
            },
            {
                "id": "999",
                "nickname": "MainPlayer",
                "score": 32,
                "cards": []
            }
        ],
        "currentTurn": 0,
        "cards": [],

    };
//let newLobby;
let lobbies = [    {
    "id": "234",
    "gameName": "Uno",
    "players": [
        {
            "id": "Klas",
            "nickname": "Klas",
            "score": 999,
            "cards": []
        },
        {
            "id": "Hasse",
            "nickname": "Hasse",
            "score": 2222,
            "cards": []
        },
        {
            "id": "Rogge",
            "nickname": "Rogge",
            "score": 32,
            "cards": []
        },
        {
            "id": "999",
            "nickname": "MainPlayer",
            "score": 32,
            "cards": []
        }
    ],
    "currentTurn": 0,
    "cards": [],

},
    {
        "id": "234",
        "gameName": "Uno",
        "players": [
            {
                "id": "Klas",
                "nickname": "Klas",
                "score": 999,
                "cards": []
            },
            {
                "id": "Hasse",
                "nickname": "Hasse",
                "score": 2222,
                "cards": []
            },
            {
                "id": "Rogge",
                "nickname": "Rogge",
                "score": 32,
                "cards": []
            },
            {
                "id": "999",
                "nickname": "MainPlayer",
                "score": 32,
                "cards": []
            }
        ],
        "currentTurn": 0,
        "cards": [],

    },
    {
        "id": "JAA BRA DETTA ÖR INDEX 3",
        "gameName": "Uno",
        "players": [
            {
                "id": "Klas",
                "nickname": "Klas",
                "score": 999,
                "cards": []
            },
            {
                "id": "Hasse",
                "nickname": "Hasse",
                "score": 2222,
                "cards": []
            },
            {
                "id": "Rogge",
                "nickname": "Rogge",
                "score": 32,
                "cards": []
            },
            {
                "id": "999",
                "nickname": "MainPlayer",
                "score": 32,
                "cards": []
            }
        ],
        "currentTurn": 0,
        "cards": [],

    }];

function getLobbyIndexById(lobbyId) {
    return lobbies.findIndex(l => l.id === lobbyId)
}

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('user disconnected')

    })
    console.log('a user connected', socket.id);

    socket.on('create lobby', async (socketLobbyId) => {

        lobbies.push({
            id: socketLobbyId,
            gameName: "Uno",
            players: [

            ],
            currentTurn: 0,
            cardDecks: [],
            currentCard: {},
            currentHistoryCardDeckIndex: 0,
            currentSportsCardDeckIndex: 0,
            currentTechCardDeckIndex: 0,
            currentCountryCardDeckIndex: 0,
            currentCat: ""

        });

        const lobbyIndex = getLobbyIndexById(socketLobbyId);
        console.log("VETTE FAN: " + lobbies[getLobbyIndexById("JAA BRA DETTA ÖR INDEX 3")].id)

        if (lobbies[lobbyIndex].cardDecks.length < 4){
            lobbies[lobbyIndex].cardDecks.push(await getHistorical('sweden'));
            lobbies[lobbyIndex].cardDecks.push(await getHistorical('sports'));
            lobbies[lobbyIndex].cardDecks.push(await getHistorical('country'));
            lobbies[lobbyIndex].cardDecks.push(await getHistorical('tech'));
        }
        socket.emit('lobby created', socketLobbyId);
    })

    socket.on('get lobby data', (lobbyId, dealFirstCards, callback) => {
        socket.join(lobbyId)
        console.log("User connected to Room" + lobbyId)
        const lobbyIndex = getLobbyIndexById(lobbyId);
        console.log('get lobby data    --    ' + lobbyIndex)
/*        if(dealFirstCards){
            let index = 0;
            lobbies[lobbyIndex].players.forEach(p => {
                if(p.cards.length < 1){
                    let c = lobbies[lobbyIndex].cardDecks[0].cards[index]
                    c.isSafe = true;
                    c.color = 'green';
                    p.cards.push(c);
                }
                index++;
            })
        }
        */
        callback({
            lobby: lobbies[lobbyIndex]
        })
    })
    socket.on('join room and get lobby data', async (lobbyId, username, playerId) => {

        const lobbyIndex = getLobbyIndexById(lobbyId);
        console.log('join room and get lobby data ----------------------||       ' + lobbyIndex)
        lobbies[lobbyIndex].players.push({id: playerId, cards: [], nickname: username, score: 0})


        io.to(lobbyId).emit('new user joined', lobbies[lobbyIndex])
    })

    socket.on('start game', lobbyId => {
        const lobbyIndex = getLobbyIndexById(lobbyId);

        let index = 0;
        lobbies[lobbyIndex].players.forEach(p => {
            if(p.cards.length < 1){
                let c = lobbies[lobbyIndex].cardDecks[0].cards[index]
                c.isSafe = true;
                c.color = 'green';
                p.cards.push(c);
            }
            index++;
        })

        io.to(lobbyId).emit('play', lobbyId)
    })

    //Game Logic
    socket.on('random card', (lobbyId) => {
        const lobbyIndex = getLobbyIndexById(lobbyId);
        lobbies[lobbyIndex] = randomCard(lobbies[lobbyIndex]);
        io.to(lobbyId).emit('random card', lobbies[lobbyIndex])
    })
    socket.on('change turn', (lobbyId) => {
        const lobbyIndex = getLobbyIndexById(lobbyId);
        lobbies[lobbyIndex] = changeTurn(lobbies[lobbyIndex]);
        io.to(lobbyId).emit('turn changed', lobbies[lobbyIndex])
    })
    socket.on('guess before', (lobbyId, index, pid) => {
        const lobbyIndex = getLobbyIndexById(lobbyId);

        console.log("guess before")
        let guessIs;

        const playerCards = lobbies[lobbyIndex].players.find(p => p.id === pid).cards;
        const playerIndex = lobbies[lobbyIndex].players.findIndex(p => p.id === pid);
        if (lobbies[lobbyIndex].currentCard.year < playerCards[index].year || lobbies[lobbyIndex].currentCard.year === playerCards[index].year){
            lobbies[lobbyIndex].currentCard.isSafe = false;
            lobbies[lobbyIndex].players[playerIndex].cards.push(lobbies[lobbyIndex].currentCard);
            lobbies[lobbyIndex].players[playerIndex].cards.sort((a, b) => parseInt(a.year) - parseInt(b.year))
            guessIs = true;
            console.log('rätt')
        }
        else {
            lobbies[lobbyIndex].players[playerIndex].cards = lobbies[lobbyIndex].players[playerIndex].cards.filter(c => c.isSafe === true);
            console.log('else')
            lobbies[lobbyIndex] = changeTurn(lobbies[lobbyIndex])
            guessIs = false;
            console.log('fel')
        }

        console.log('emitting: guess checked')
        io.to(lobbyId).emit('guess checked', lobbies[lobbyIndex], guessIs)

    })

    socket.on('guess after', (lobbyId, index, pid) => {
        const lobbyIndex = getLobbyIndexById(lobbyId);
        let guessIs;

        const playerCards = lobbies[lobbyIndex].players.find(p => p.id === pid).cards;
        const playerIndex = lobbies[lobbyIndex].players.findIndex(p => p.id === pid);
        //If last card
        if (playerCards.length === index + 1){
            if (lobbies[lobbyIndex].currentCard.year > playerCards[index].year || lobbies[lobbyIndex].currentCard.year === playerCards[index].year){
                console.log('rätt')
                lobbies[lobbyIndex].currentCard.isSafe = false;
                lobbies[lobbyIndex].players[playerIndex].cards.push(lobbies[lobbyIndex].currentCard);
                lobbies[lobbyIndex].players[playerIndex].cards.sort((a, b) => parseInt(a.year) - parseInt(b.year))
                guessIs = true;

            }
            else {
                lobbies[lobbyIndex].players[playerIndex].cards = lobbies[lobbyIndex].players[playerIndex].cards.filter(c => c.isSafe === true);
                lobbies[lobbyIndex] = changeTurn(lobbies[lobbyIndex])
                guessIs = false;
                console.log('fel')
            }
        }
        else {
            console.table(playerCards)
            console.log('det rätta året' + lobbies[lobbyIndex].currentCard.year)
            console.log('kort index' + index)
            console.log(lobbies[lobbyIndex].currentCard.year > playerCards[index].year)
            console.log(lobbies[lobbyIndex].currentCard.year < playerCards[index + 1].year)
            if ((lobbies[lobbyIndex].currentCard.year > playerCards[index].year && lobbies[lobbyIndex].currentCard.year < playerCards[index + 1].year) || lobbies[lobbyIndex].currentCard.year === playerCards[index].year || lobbies[lobbyIndex].currentCard.year === playerCards[index + 1].year){
                console.log('rätt')
                lobbies[lobbyIndex].currentCard.isSafe = false;
                lobbies[lobbyIndex].players[playerIndex].cards.push(lobbies[lobbyIndex].currentCard);
                lobbies[lobbyIndex].players[playerIndex].cards.sort((a, b) => parseInt(a.year) - parseInt(b.year))
                guessIs = true;
            }
            else {
                lobbies[lobbyIndex].players[playerIndex].cards = lobbies[lobbyIndex].players[playerIndex].cards.filter(c => c.isSafe === true);
                lobbies[lobbyIndex] = changeTurn(lobbies[lobbyIndex])
                guessIs = false;
                console.log('fel')
            }
        }
        console.log('emitting: guess checked to, ' + lobbyId)
        io.to(lobbyId).emit('guess checked', lobbies[lobbyIndex], guessIs)
    })

});

async function getHistorical(cat) {
    const meta = {
        'X-Api-Key': 'YuAhR6x2/fckgC8JWJOcBA==K7gB4sAqTFD250vK'
    };
    const headers = new fetch.Headers(meta)

    const response = await fetch('https://api.api-ninjas.com/v1/historicalevents?text=' + cat, {headers});
    const data = await response.json();
    let cardDeck = {};
    cardDeck.category = cat;
    cardDeck.cards = data;
    return cardDeck;
}

function randomCard(lobby){
    const randomDeck = Math.floor(Math.random() * 4);
    switch (randomDeck) {
        case 0:
            lobby.currentCard = lobby.cardDecks[0].cards[lobby.currentHistoryCardDeckIndex];
            lobby.currentHistoryCardDeckIndex += 1;
            lobby.currentCat = 'Sweden'
            return lobby;

        case 1:
            lobby.currentCard = lobby.cardDecks[1].cards[lobby.currentSportsCardDeckIndex];
            lobby.currentSportsCardDeckIndex += 1;
            lobby.currentCat = 'Sports'
            return lobby;

        case 2:
            lobby.currentCard = lobby.cardDecks[2].cards[lobby.currentTechCardDeckIndex];
            lobby.currentTechCardDeckIndex += 1;
            lobby.currentCat = 'Tech'
            return lobby;

        case 3:
            lobby.currentCard = lobby.cardDecks[3].cards[lobby.currentCountryCardDeckIndex];
            lobby.currentCountryCardDeckIndex += 1;
            lobby.currentCat = 'Country'
            return lobby;

    }
}

function changeTurn(lobby){
    lobby.players[lobby.currentTurn].cards.forEach(c => c.isSafe = true)
    if (lobby.currentTurn === (lobby.players.length - 1)){
        lobby.currentTurn = 0;
    }
    else {
        lobby.currentTurn += 1;
    }
    return lobby;
}

