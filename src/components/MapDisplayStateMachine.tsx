import type { PointCloudNode } from "src/api/types"

interface BaseStateParams {}

export interface MapDisplayStateParams extends BaseStateParams {
    'select_node_enter': number
    'select_node_exit': PointCloudNode
}
export type MapDisplayState = keyof MapDisplayStateParams


export class StateMachine<SP extends BaseStateParams> {
    curState:keyof SP | null
    listeners:{[K in keyof SP]: ((p:SP[K])=>void)[]}

    constructor(){
        this.curState = null
        this.listeners = {} as any
    }

    getState():keyof SP | null {
        return this.curState; 
    }

    isState<S extends keyof SP>(state:S | null):boolean {
        if (this.curState == null && state == null) return true
        else if (this.curState == null || this.curState == null) return false
        return this.curState == state
    }

    setState<S extends keyof SP>(state:S | null, param:SP[S]){
        // this.prevState = this.curState; 
        this.curState = state; 

        if(this.curState != null && this.listeners[this.curState] != null){
            this.listeners[this.curState].forEach(f => f(param))
        }
    }

    addListener<S extends keyof SP>(state:S, handler:(param:SP[S])=>void) {
        if(!this.listeners[state])
            this.listeners[state] = []

        this.listeners[state].push(handler)
    }

    removeListener<S extends keyof SP>(state:S, handler:(param:SP[S])=>void) {
        if(this.listeners[state])
            this.listeners[state] = this.listeners[state].filter(h => h != handler)
    }
}

