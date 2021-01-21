export const initialState = {
  count: 1,
  cameraCount: 1,
  cameraList: [],
}

export function ACTION_ADD_COUNT(
  state: StoreStates,
  action: StoreAction<'ACTION_ADD_COUNT'>
): { count: number } {
  console.log({ state, action })
  return { count: state.count + 1 }
}

export function ACTION_SET_CAMERACOUNT(
  state: StoreStates,
  action: StoreAction<'ACTION_SET_CAMERACOUNT'>
): { cameraCount: number } {
  console.log({ state, action })
  return { cameraCount: action.data }
}

export function ACTION_SET_CAMERALISTPAGE(
  state: StoreStates,
  action: StoreAction<'ACTION_SET_CAMERALISTPAGE'>
): { cameraList: Array<Camera> } {
  console.log({ state, action })
  return { cameraList: action.data }
}

declare global {
  interface StoreStates {
    count: number
    cameraCount: number
    cameraList: Array<object>
  }

  interface StoreActions {
    ACTION_ADD_COUNT: number
    ACTION_SET_CAMERACOUNT: number
    ACTION_SET_CAMERALISTPAGE: Array<Camera>
  }
}
