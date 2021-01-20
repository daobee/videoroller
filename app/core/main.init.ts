import * as tools from './tools'
import { store } from './store'
import * as api from './api'

export async function initMain() {
  return new Promise<void>(async (resolve) => {
    global.__$tools = tools
    global.__$api = api
    global.__$store = store

    /* $tools.log.info('Main process inited.This is INFO') */
    resolve()
  })
}
