import React from 'react'
import { Button, Table, Popconfirm, Upload } from 'antd'

import { withStore } from '@/src/components'

type EditableTableProps = Parameters<typeof Table>[0]

interface CamerasPageProps extends PageProps, StoreProps {
  cameraCount: StoreStates['cameraCount']
  cameraList: StoreStates['cameraList']
}

declare interface CamerasPageState {
  resData: Partial<queryTestInfoUsingGET.Response>
  currentFocusing: any
  currentUploading: Camera[] | null
  currentPage: number
  pageSize: number
  uploadFileList: any[]
  loading: boolean
  createWindowLoading: boolean
  asyncDispatchLoading: boolean
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>

/**
 * CamerasPageProps 是组件的 props 类型声明
 * CamerasPageState 是组件的 state 类型声明
 * props 和 state 的默认值需要单独声明
 */
@withStore(['cameraList', 'cameraCount'])
export default class Cameras extends React.Component<CamerasPageProps, CamerasPageState> {
  // state 初始化
  state: CamerasPageState = {
    resData: {},
    currentFocusing: null,
    currentUploading: null,
    currentPage: 1,
    pageSize: 5,
    uploadFileList: [],
    loading: false,
    createWindowLoading: false,
    asyncDispatchLoading: false,
  }

  // 构造函数
  constructor(props: CamerasPageProps) {
    super(props)
  }

  componentDidMount(): void {
    console.log(this)
    this.props.dispatch(this.queryCameraListPage)
  }

  get pageParams(): string {
    return JSON.stringify(this.props.match.params)
  }

  get pageQuery(): string {
    return JSON.stringify(this.props.query)
  }

  get queryCameras(): string {
    return JSON.stringify($db.cameras.where('uuid').above(0).toArray(), null, 2)
  }

  render(): JSX.Element {
    // const { resData, loading, createWindowLoading } = this.state
    const { currentPage, pageSize, asyncDispatchLoading, uploadFileList } = this.state
    const { cameraList, cameraCount } = this.props
    const columns = [
      {
        title: 'UUID',
        dataIndex: 'uuid',
        key: 'uuid',
      },
      {
        title: 'NAME',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'operation',
        dataIndex: 'operation',
        render: (_: any, camera: Camera) =>
          cameraList.length >= 1 ? (
            <Popconfirm
              title={`Sure to delete ${camera.uuid}?`}
              onConfirm={() => {
                this.setState({ currentFocusing: camera }, () => {
                  this.props.dispatch(this.delCameraFromDB)
                  this.props.dispatch(this.queryCameraListPage)
                })
              }}
            >
              <a>Delete</a>
            </Popconfirm>
          ) : null,
      },
    ]
    const pagination = {
      current: currentPage,
      total: cameraCount,
      pageSize: pageSize,
      showSizeChanger: true,
      pageSizeOptions: ['5', '9', '20'],
      onShowSizeChange: (...v: any[]) => {
        this.setState({ pageSize: v[v.length - 1] })
        this.props.dispatch(this.queryCameraListPage)
      },
      onChange: (...v: any[]) => {
        this.setState({ currentPage: v[0] })
        this.props.dispatch(this.queryCameraListPage)
      },
    }
    return (
      <div className="cameras layout-padding">
        <p>Params: {this.pageParams}</p>
        <p>Query: {this.pageQuery}</p>
        <p>
          <a>currentPage: {currentPage}</a>
        </p>
        <p>
          <a>pageSize: {pageSize}</a>
        </p>
        <p>
          <a>cameraCount: {cameraCount}</a>
        </p>
        <Button
          type="primary"
          onClick={() => {
            this.props.dispatch(this.queryCameraListPage)
          }}
        >
          Reload
        </Button>
        <Button
          type="primary"
          onClick={() => {
            this.props.dispatch(this.addCameraToDB)
          }}
        >
          AddCamera
        </Button>
        <Button
          type="primary"
          onClick={() => {
            this.props.dispatch(this.dropAllCameraFromDB)
          }}
        >
          DropCamera
        </Button>
        <Upload fileList={uploadFileList} customRequest={this.customRequest}>
          <Button
            type="primary"
            onClick={() => {
              console.log('uploading')
            }}
          >
            ImportJSON
          </Button>
        </Upload>
        <Table<Camera>
          rowKey="uuid"
          bordered
          dataSource={cameraList}
          loading={asyncDispatchLoading}
          columns={columns as ColumnTypes}
          pagination={pagination}
        />
      </div>
    )
  }

  /**
   * 摄像机查询
   * 从indexdedDB查询摄像机列表分页及设备总数，放到react store以供显示
   */
  queryCameraListPage = async (dispatch: Dispatch): Promise<void> => {
    this.setState({ asyncDispatchLoading: true })
    try {
      const count: number = await $db.cameras.count()
      dispatch({ type: 'ACTION_SET_CAMERACOUNT', data: count })
      // 如果设备被删除后，当前页码不再存在，则回到最后一页
      if (Math.ceil(count / this.state.pageSize) < this.state.currentPage)
        this.setState({ currentPage: Math.ceil(count / this.state.pageSize) || 1 })
      // 应用筛选和排序条件
      const cameras: Array<Camera> = await $db.cameras
        .offset((this.state.currentPage - 1) * this.state.pageSize)
        .limit(this.state.pageSize)
        .toArray()
      dispatch({ type: 'ACTION_SET_CAMERALISTPAGE', data: cameras })
    } catch (error) {
      console.error(error)
    }
    this.setState({ asyncDispatchLoading: false })
  }

  /**
   * 添加摄像机
   * 添加camera到indexdedDB
   */
  addCameraToDB = async (dispatch: Dispatch): Promise<void> => {
    this.setState({ asyncDispatchLoading: true })
    try {
      // 添加camera
      const index: number = await $db.cameras.add({
        uuid: Math.floor(Math.random() * 10000),
        name: Math.floor(Math.random() * 100).toString(),
      })
      console.log(`camera added: ${index}`)
      dispatch(this.queryCameraListPage)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 删除摄像机
   * 通过uuid删除camera
   */
  delCameraFromDB = async (dispatch: Dispatch): Promise<void> => {
    this.setState({ asyncDispatchLoading: true })
    try {
      // 删除camera
      const num: number = await $db.cameras.where('uuid').equals(this.state.currentFocusing.uuid).delete()
      console.log(`${num} camera deleted: ${this.state.currentFocusing.uuid}`)
      this.setState({ currentFocusing: null })
      dispatch(this.queryCameraListPage)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 清空数据库
   * 删除所有camera
   * @param dispatch
   */
  dropAllCameraFromDB = async (dispatch: Dispatch): Promise<void> => {
    this.setState({ asyncDispatchLoading: true })
    try {
      await $db.cameras.clear()
      dispatch(this.queryCameraListPage)
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * 替换Upload上传行为，读取本地json，放到内存
   * @param options
   */
  customRequest = (options: any) => {
    this.setState({ asyncDispatchLoading: true })
    const { file } = options
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = (progress) => {
      try {
        const jsonFile = JSON.parse(progress.target?.result?.toString() || '{}')
        this.setState({ currentUploading: jsonFile }, () => {
          this.props.dispatch(this.importCameraFromJSON)
        })
      } catch (error) {
        // console.log('error', error)
        this.setState({ asyncDispatchLoading: false })
      }
    }
  }

  /**
   * 导入摄像机json至数据库
   * @param dispatch
   */
  importCameraFromJSON = async (dispatch: Dispatch): Promise<void> => {
    this.setState({ asyncDispatchLoading: true })
    if (Array.isArray(this.state.currentUploading)) {
      const lastKey: number = await $db.cameras.bulkPut(
        this.state.currentUploading.map<Camera>((v) => {
          try {
            return {
              uuid: parseInt(String(v.uuid)),
              id: parseInt(String(v.id)),
              name: String(v.name),
              centerCode: parseInt(String(v.centerCode)),
              roadCode: parseInt(String(v.roadCode)),
              milestone: parseInt(String(v.milestone)),
              longitude: parseInt(String(v.longitude)),
              latitude: parseInt(String(v.latitude)),
              status: String(v.status),
              infoUpdatetime: new Date(),
              rtmpUpdatetime: String(v.rtmpAddress).indexOf('rtmp://') > 0 ? new Date() : undefined,
              isFaultCount: !!parseInt(String(v.isFaultCount)),
              isShow: !!parseInt(String(v.isShow)),
              rtmpAddress: String(v.rtmpAddress).indexOf('rtmp://') > 0 ? String(v.rtmpAddress) : undefined,
            }
          } catch (_) {
            return {}
          }
        })
      )
      console.log('bulkput complete:', lastKey)
    }
    this.setState({ currentUploading: null, currentFocusing: null, asyncDispatchLoading: false })
    dispatch(this.queryCameraListPage)
  }
} // class Cameras end
