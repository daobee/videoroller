import React from 'react'
import { Button, Table, Popconfirm, Upload, Input, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

import { withStore } from '@/src/components'

/** interfaces */
import { Collection } from 'dexie'
import { RcCustomRequestOptions } from 'antd/lib/upload/interface'
import {
  TablePaginationConfig,
  SorterResult,
  TableCurrentDataSource,
  FilterDropdownProps,
} from 'antd/lib/table/interface'

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
  sortKey: string | null
  sortOrder: string | null
  sortKeyPre: string | null
  sortOrderPre: string | null
  filters: Record<string, React.Key[] | null> | null
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
    sortKey: null,
    sortOrder: null,
    sortKeyPre: null,
    sortOrderPre: null,
    filters: null,
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
    this.props.dispatch(this.queryCameraListPage)
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
        sorter: true,
        ...this.getColumnSearchProps('uuid'),
      },
      {
        title: 'NAME',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        ...this.getColumnSearchProps('name'),
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
    }
    return (
      <div className="cameras layout-padding">
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
          size="small"
          dataSource={cameraList}
          loading={asyncDispatchLoading}
          columns={columns as ColumnTypes}
          pagination={pagination}
          onChange={this.handleTableChange}
        />
      </div>
    )
  }

  handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, React.Key[] | null>,
    sorter: SorterResult<Camera> | SorterResult<Camera>[],
    extra: TableCurrentDataSource<Camera>
  ): void => {
    switch (extra.action) {
      case 'paginate':
        // 翻页或修改每页显示条数操作
        this.setState({ currentPage: pagination.current ?? 1, pageSize: pagination.pageSize ?? 5 }, () => {
          this.props.dispatch(this.queryCameraListPage)
        })
        break
      case 'sort':
        if (!Array.isArray(sorter))
          this.setState(
            {
              sortKey: typeof sorter.field == 'string' ? sorter.field : null,
              sortOrder: typeof sorter.order == 'string' ? sorter.order : null,
            },
            () => {
              this.props.dispatch(this.queryCameraListPage)
            }
          )
        break
      case 'filter':
        this.setState({ filters: filters }, () => this.props.dispatch(this.queryCameraListPage))
        break
      default:
        console.log('Unhandlded table action:', extra.action)
        break
    }
  }
  /**
   * 摄像机查询
   * 从indexdedDB查询摄像机列表分页及设备总数，放到react store以供显示
   */
  queryCameraListPage = async (dispatch: Dispatch): Promise<void> => {
    this.setState({ asyncDispatchLoading: true })
    try {
      /** 应用筛选和排序条件 */
      // 创建Collection
      let cameraCollection: Collection<Camera, number> = $db.cameras.toCollection()
      // 排序
      const { sortKey, sortOrder, sortKeyPre, sortOrderPre } = this.state
      if (!(sortKey == sortKeyPre && sortOrder == sortOrderPre)) {
        if (sortKey && sortOrder == 'ascend') cameraCollection = await $db.cameras.orderBy(sortKey)
        if (sortKey && sortOrder == 'descend') cameraCollection = await $db.cameras.orderBy(sortKey).reverse()
        this.setState({ sortKeyPre: sortKey, sortOrderPre: sortOrder })
      } else console.log('skiping sort')
      // 关键词搜索
      const { filters } = this.state
      cameraCollection = cameraCollection.filter((camera) => {
        let flag = true
        if (filters) {
          Object.keys(filters).forEach((key) => {
            if (filters && filters[key]) {
              if (String(camera[key]).indexOf(String(filters[key])) < 0) flag = false
            }
          })
        }
        return flag
      })
      /** 排序、过滤结束 */
      // 更新查询结果总数
      const count: number = await cameraCollection.count()
      dispatch({ type: 'ACTION_SET_CAMERACOUNT', data: count })
      // 如果设备被删除后，当前页码不再存在，则回到最后一页
      const { pageSize, currentPage } = this.state
      const maxPage = Math.ceil(count / pageSize)
      if (maxPage < currentPage) {
        this.setState({ currentPage: maxPage }, async () => {
          // 切出分页
          cameraCollection = cameraCollection.offset((maxPage - 1) * pageSize).limit(pageSize)
          // 执行查询
          dispatch({ type: 'ACTION_SET_CAMERALISTPAGE', data: await cameraCollection.toArray() })
        })
      } else {
        // 切出分页
        cameraCollection = cameraCollection.offset((currentPage - 1) * pageSize).limit(pageSize)
        // 执行查询
        dispatch({ type: 'ACTION_SET_CAMERALISTPAGE', data: await cameraCollection.toArray() })
      }
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
  customRequest = (options: RcCustomRequestOptions): void => {
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

  /**
   * 关键字搜索弹窗
   */
  searchInput: Input | null = null
  /**
   * 生成筛选按钮及弹窗
   * @param dataIndex
   */
  getColumnSearchProps = (dataIndex: string): Record<string, unknown> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => (this.searchInput = node)}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              if (clearFilters) clearFilters()
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    // onFilter: (value: string | number | boolean, record: Camera) =>
    //   record[dataIndex]
    //     ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
    //     : '',
    onFilterDropdownVisibleChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => {
          if (this.searchInput) this.searchInput.select()
        }, 100)
      }
    },
  })
} // class Cameras end
