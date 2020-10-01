const express = require('express')
const app = express()
const server = app.listen(8000)
const io = require('socket.io')(server)
const { Game } = require('./game')
const { Map } = require('./case')
const { Player } = require('./players')

var nb_player = 0;
var pos = [[0, 0], [5, 5]]
var game = new Game();
var board = new Map();
app.use(express.static('public'))
io.on('connection', (socket) => {
	console.log('a user connected')
	/*setInterval(() =>{
		console.log(socket.disconnected);
	}, 1000);*/
	socket.name= "User" + nb_player;
	load_game(socket)
});

function load_game(socket) {
	game.map = board;
	game.nbPlayer = nb_player;
	game.players.push(new Player("Iop", "Perso", pos[nb_player], nb_player, board));
	game.current = 0;
	newJoin(socket, game, nb_player++);
}

function newJoin (socket, game, id)
{
	game.current_player = game.players[0];
	socket.emit('stateChanged', game, id, 0);
	if (id >= 1)
		io.emit("new_log", game);
	socket.on('previsu', (data) =>{
		if (game.players[id].classe.act_spell == undefined)
			socket.emit('end_previsu', game.players[id].pf.pathfinding(data, game.players[id]));
	});
	socket.on('spell_press', (spell_id) =>{
		socket.emit('preshow_range', game.players[id].classe.spells[spell_id].pre_show(game.players[id]),
			game.players[id].classe.spells[spell_id].al_show, game.players[id]);
	});
	socket.on('attack', (obj) =>{
		let enemy;
		if (obj.isPers == undefined)
			enemy = undefined;
		else
			enemy = game.players[obj.isPers];
		game.players[id].classe.act_spell.do(game.players[id], enemy);
		socket.emit('attacked', game.players[id].classe.act_spell, enemy, game);
	})
	socket.on('move', (path) =>{
		if (game.current_player == game.players[id])
		{
			var i = 0;
			var intID = setInterval(() =>{
				game.players[id].move(path[i].data.posx, path[i].data.posy);
				io.emit('change_pos', game, id);
				if (i == path.length - 1)
					clearInterval(intID);
				i++;
			}, 100);
		}
	});
	socket.on('passe_tour', (id) =>{
		if (game.current_player == game.players[id])
		{
			game.players[id].reset();
			let n = id;
			if (n + 1 == nb_player)
				n = 0;
			else
				n++;
			game.current_player = game.players[n];
			socket.emit('end_tour', game, id);
		}
	})
}
