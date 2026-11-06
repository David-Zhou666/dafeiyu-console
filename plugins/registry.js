/* 控制台插件清单
 *
 * 加一个插件：
 *   1. 在 console/public/plugins/<id>/ 放一个 index.html（可带自己的 css/js）
 *   2. 在下面加一条
 *   3. 刷新控制台的「插件」页
 *
 * permissions 目前只支持只读：
 *   overview:read / stats:read / config:read / persona:read / group:read
 * 写权限（聊天、改配置）等宿主开了再登记，别先写在这里骗自己。
 */
window.QIYU_PLUGINS = [
  {
    id: 'rhythm',
    name: '今日节奏',
    version: '0.1.0',
    desc: '把作息、她今天开口的时刻和心情画在一根 24 小时尺上。',
    icon: '◔',
    permissions: ['overview:read'],
    entry: '/plugins/rhythm/index.html',
  },
]
