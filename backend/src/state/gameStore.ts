import {type GameState} from '@itsu/shared/src/types/game'

class GameManager {
    private activeGames:Map<string, GameState> = new Map()
    constructor(){
        setInterval(()=> this.cleanup(), 5*60*1000)
    }

    public getGame(id: string) { return this.activeGames.get(id)}

    public createGame(id:string, intialData: GameState) {
        this.activeGames.set(id, {...intialData, lastActivity:Date.now()})
    }

    private cleanup(){
        const NOW= Date.now()
        for(const [id, game] of  this.activeGames.entries()){
            if(NOW-game.lastActivity>180000 || game.status==="FINISHED" || game.status==="FAILED"){
                this.activeGames.delete(id)
            }
        }
    }
}

export const gameManager = new GameManager()