const routes: RouteConfig[] = [
  {
    key: 'Demo',
    path: '/demo',
    createConfig: {
      single: false,
    },
  },
  {
    key: 'PageParams',
    path: '/page-params/:test',
  },
  {
    key: 'Cameras',
    path: '/cameras/:test',
  },
]

export default routes
