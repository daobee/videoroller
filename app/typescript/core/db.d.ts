import { CameraDatabase } from '@/core/db'
declare global {
  const $db: CameraDatabase
  namespace NodeJS {
    interface Global {
      __$db: CameraDatabase
    }
  }
}
