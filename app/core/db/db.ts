import Dexie from 'dexie'

export class CameraDatabase extends Dexie {
  public cameras: Dexie.Table<Camera, number> // id is number in this case
  public constructor() {
    super('CameraDatabase')
    this.version(1).stores({
      cameras:
        '&uuid,id,name,centerCode,roadCode,milestone,longitude,latitude,status,infoUpdatetime,rtmpUpdatetime,isFaultCount,isShow,rtmpAddress',
    })
    this.cameras = this.table('cameras')
  }
}

export const db = new CameraDatabase()

declare global {
  interface Camera {
    uuid?: number
    id?: number
    name?: string
    centerCode?: number
    roadCode?: number
    milestone?: number
    longitude?: number
    latitude?: number
    status?: string
    infoUpdatetime?: Date
    rtmpUpdatetime?: Date
    isFaultCount?: boolean
    isShow?: boolean
    rtmpAddress?: string
  }
}
