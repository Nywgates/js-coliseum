const { Iop } = require('./Iop.js')
const { Cra } = require('./Iop.js')

class pf{
    constructor (map, id) {
        this.map = map;
        this.id = id;
    }
    get_near(x, y) {
        if (y < 0 || y >= this.map.largeur)
            return (undefined);
        if (x < 0 || x >= this.map.hauteur)
            return (undefined);
        let obj = this.map.t_map[x][y];
        if (obj.empty == true && (obj.isPers == undefined) && obj.type != 2)
            return (this.map.t_map[x][y]);
        else
            return (undefined);
    }
    shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }
        return array;
      }
    get_neighbor(obj) {
        let neighbor = new Array(4);
        neighbor[0] = this.get_near(obj.posx, obj.posy - 1);
        neighbor[1] = this.get_near(obj.posx + 1, obj.posy);
        neighbor[2] = this.get_near(obj.posx - 1, obj.posy);
        neighbor[3] = this.get_near(obj.posx, obj.posy + 1);
        return (this.shuffle(neighbor));
    }
    get_lowest_fscore(openset){
        var obj = openset[0];
        var mem;
        if (obj == undefined)
            mem = Infinity;
        else
            mem = obj.fScore;
        for (let i = 0; i < openset.length; i++)
        {
            if (openset[i] != undefined && openset[i].fScore < mem)
            {
                mem = openset[i].fScore;
                obj = openset[i];
            }   
        }
        return (obj);
    }
    h(start, obj) {
        let nXDifferenceTiles = Math.round(Math.abs(obj.posx - start.posx));
        let nYDifferenceTiles = Math.round(Math.abs(obj.posy - start.posy));
        let cost = nXDifferenceTiles + nYDifferenceTiles;
        return (cost);
    }
    get_index(openset, item) {
        for (let i = 0; i < openset.length; i++)
        {
            if (openset[i] == item)
                return (i);
        }
        return (undefined);
    }
    in(lst, obj) {
        let i = 0;
        while (i < lst.length)
        {
            if (lst[i] == obj)
                return (1);
            i++;
        }
        return (0);
    }
    init_path(node, obj) {
        if (node.fScore != Infinity) {
            if ((this.h(node, obj) + 1) * 10 < node.fScore)
                return (1);
            else
                return (0);
        }
        return (0);
    }
    get_path(end, player) {
        let path = [];
        let tmp = end;
        while (tmp.cameFrom != undefined)
        {
            path.push([tmp.posx, tmp.posy]);
            tmp = tmp.cameFrom;
        }
        this.map.reset_score();
        if (path.length <= player.pm)
            return (path.reverse());
        else
            return (undefined)
    }
    pathfinding(obj, player) {
        let start = player.bloc;
        start.gScore = 0;
        start.fScore = 30;
        let openset = new Array(1);
        let closedset = new Array();
        openset[0] = start;
        let n = -1;
        let max = 25;
        let current;
        let neighbor;
        while (1 && ++n < max)
        {
            if ((current = this.get_lowest_fscore(openset)) == undefined)
                break;
            openset.splice(this.get_index(openset, current), 1);
            closedset.push(current);
            if (current.posx == obj.posx && current.posy == obj.posy)
                return (this.get_path(current, player));
            else
            {
                neighbor = this.get_neighbor(current);
                for (let i = 0; i < neighbor.length; i++)
                {
                    if (neighbor[i] != undefined)
                    {
                        if(this.in(closedset, neighbor[i]))
                            ;
                        else if (this.init_path(neighbor[i], obj) || !this.in(openset, neighbor[i]))
                        {
                            neighbor[i].gScore = 1;
                            neighbor[i].fScore = (this.h(neighbor[i], obj) + neighbor[i].gScore) * 10;
                            neighbor[i].cameFrom = current;
                            if (!this.in(openset, neighbor[i]))
                                openset.push(neighbor[i]);
                        }
                    }
                }
            }
        }
        return (undefined);
    }
}

class Player {
	constructor(classe, log, pos, map, game_id) {
		switch (classe){
			case 'Iop': {
                this.classe = new Iop(); break ;}
            case 'Cra' : {
                this.classe = new Cra(); break ;}
        }
        log.team = game_id % 2 + 1;
        this.team = log.team;
        this.dead = false;
		this.pseudo = log.pseudo;
		this.pos = pos;
        this.id = log.id;
        this.game_id = game_id;
        this.bloc = map.t_map[pos[0]][pos[1]];
        this.bloc.isPers = this.game_id;
		this.save = [500, 5, 6];
		this.pv = this.save[0];
		this.pm = this.save[1];
		this.pa = this.save[2];
        this.pf = new pf(map, this.id);
        this.map = map;
        this.on_move = false;
	}
	move (x, y) {
        let pos = this.bloc.pos;
        this.map.t_map[pos[0]][pos[1]].isPers = undefined;
        this.bloc.isPers = undefined;
        this.pos = [x, y];
        let diff = [this.bloc.pos[0] -  this.pos[0], this.bloc.pos[1] -  this.pos[1]];
        this.get_rot(diff);    
        // 0 1 = 3q_dos
        // 1 0 = 3q_dos_flip
        // -1 0 = 3q_face
        // 0 -1 = 3q_face_flip
        this.bloc = this.map.t_map[x][y];
        this.bloc.isPers = this.game_id;
        this.pm -= 1;
	}
	reset (){
		this.pm = this.save[1];
		this.pa = this.save[2];
    }
    get_enemy(lst){
        let lst_enemys = [];
        for (let i = 0; i < lst.length; i++){
            if (lst[i].isPers != undefined)
                lst_enemys.push(lst[i].isPers);
        }
        return (lst_enemys);
    }
    eq_array(a, b){
        for (var i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
          }
          return true;
    }
    get_rot(diff) {
        if (this.eq_array(diff, [0, 1]))
           this.classe.rot = [0, 0];
        else if (this.eq_array(diff, [1, 0]))
            this.classe.rot = [0, 1];
        else if (this.eq_array(diff, [-1, 0]))
            this.classe.rot = [1, 0];
        else if (this.eq_array(diff, [0, -1]))
            this.classe.rot = [1, 1];
    }
}

module.exports = {
	Player, pf,
}