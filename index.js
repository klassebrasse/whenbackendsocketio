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
let newLobby;

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('user disconnected')

    })
    console.log('a user connected', socket.id);

    socket.on('join room and get lobby data', async (lobbyId, callback) => {
        socket.join(lobbyId);
        console.log("User connected to Room" + lobbyId)

        newLobby = lobbyData;
        if (newLobby.cardDecks.length < 4){
            newLobby.cardDecks.push(await getHistorical('sweden'));
            newLobby.cardDecks.push(await getHistorical('sports'));
            newLobby.cardDecks.push(await getHistorical('country'));
            newLobby.cardDecks.push(await getHistorical('tech'));


        }

        let index = 0;
        await newLobby.players.forEach(p => {
            if(p.cards.length < 1){
                let c = newLobby.cardDecks[0].cards[index]
                c.isSafe = true;
                c.color = 'green';
                p.cards.push(c);
            }
            index++;
        })

        //console.log(newLobby)
        await callback({
            lobby: lobbyData,
        })
    })
    socket.on('random card', (lobbyId) => {
        newLobby = randomCard(newLobby);
        console.log("hej")
        io.to('234').emit('random card', newLobby)
    })
    socket.on('change turn', (lobbyId) => {
        newLobby = changeTurn(newLobby);
        io.to('234').emit('turn changed', newLobby)
    })
    socket.on('guess before', (lobbyId, index, pid) => {
        console.log(io.engine.clientsCount)
        console.log("guess before")
        let guessIs;

        const playerCards = newLobby.players.find(p => p.id === pid).cards;
        const playerIndex = newLobby.players.findIndex(p => p.id === pid);
        if (newLobby.currentCard.year < playerCards[index].year || newLobby.currentCard.year === playerCards[index].year){
            newLobby.currentCard.isSafe = false;
            newLobby.players[playerIndex].cards.push(newLobby.currentCard);
            newLobby.players[playerIndex].cards.sort((a, b) => parseInt(a.year) - parseInt(b.year))
            guessIs = true;
            console.log('rätt')
        }
        else {
            newLobby.players[playerIndex].cards = newLobby.players[playerIndex].cards.filter(c => c.isSafe === true);
            console.log('else')
            newLobby = changeTurn(newLobby)
            guessIs = false;
            console.log('fel')
        }

        io.to('234').emit('guess checked', newLobby, guessIs)

    })

    socket.on('guess after', (lobbyId, index, pid) => {

        let guessIs;

        const playerCards = newLobby.players.find(p => p.id === pid).cards;
        const playerIndex = newLobby.players.findIndex(p => p.id === pid);
        //If last card
        if (playerCards.length === index + 1){
            if (newLobby.currentCard.year > playerCards[index].year || newLobby.currentCard.year === playerCards[index].year){
                console.log('rätt')
                newLobby.currentCard.isSafe = false;
                newLobby.players[playerIndex].cards.push(newLobby.currentCard);
                newLobby.players[playerIndex].cards.sort((a, b) => parseInt(a.year) - parseInt(b.year))
                guessIs = true;

            }
            else {
                newLobby.players[playerIndex].cards = newLobby.players[playerIndex].cards.filter(c => c.isSafe === true);
                newLobby = changeTurn(newLobby)
                guessIs = false;
                console.log('fel')
            }
        }
        else {
            console.table(playerCards)
            console.log('det rätta året' + newLobby.currentCard.year)
            console.log('kort index' + index)
            console.log(newLobby.currentCard.year > playerCards[index].year)
            console.log(newLobby.currentCard.year < playerCards[index + 1].year)
            if ((newLobby.currentCard.year > playerCards[index].year && newLobby.currentCard.year < playerCards[index + 1].year) || (newLobby.currentCard.year === playerCards[index].year && newLobby.currentCard.year === playerCards[index + 1].year)){
                console.log('rätt')
                newLobby.currentCard.isSafe = false;
                newLobby.players[playerIndex].cards.push(newLobby.currentCard);
                newLobby.players[playerIndex].cards.sort((a, b) => parseInt(a.year) - parseInt(b.year))
                guessIs = true;
            }
            else {
                newLobby.players[playerIndex].cards = newLobby.players[playerIndex].cards.filter(c => c.isSafe === true);
                newLobby = changeTurn(newLobby)
                guessIs = false;
                console.log('fel')
            }
        }
        io.to('234').emit('guess checked', newLobby, guessIs)
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
    if (lobby.currentTurn === 3){
        lobby.currentTurn = 0;
    }
    else {
        lobby.currentTurn += 1;
    }
    return lobby;
}

