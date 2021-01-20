import { remote } from 'electron'
import { db } from './db'

export function initRenderer(): void {
  global.__$tools = remote.getGlobal('__$tools')
  global.__$api = remote.getGlobal('__$api')
  global.__$store = remote.getGlobal('__$store')
  global.__$db = db

  /** 每次刷新页面时在db中新增一条记录，用于测试db正常工作 */
  /* $db
    .transaction('rw', $db.cameras, async () => {
      // Make sure we have something in DB:
      if ((await $db.cameras.where({ name: 'db1' }).count()) === 0) {
        const uuid = await $db.cameras.add({
          uuid: Math.floor(Math.random() * 10000),
          name: Math.floor(Math.random() * 100).toString(),
        })
        $tools.log.info(`Addded friend with uuid ${uuid}`)
      }
      // Query:
      const records = await $db.cameras.where('uuid').above(0).toArray()
      // Show result:
      $tools.log.info(`My young friends: ${JSON.stringify(records)}`)
    })
    .catch((e) => {
      $tools.log.info(e.stack || e)
    }) */
}
