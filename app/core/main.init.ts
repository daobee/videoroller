import * as tools from './tools'
import { store } from './store'
import * as api from './api'
import { nms } from './nms'

export async function initMain() {
  return new Promise<void>(async (resolve) => {
    global.__$tools = tools
    global.__$api = api
    global.__$store = store

    nms.run()
    /* $tools.log.info('Main process inited.This is INFO') */
    resolve()
  })
}
