# ZoneMap

[English](README.md) | **[zonemap.live](https://zonemap.live)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white&style=flat-square)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

时区可视化 Web 应用。在交互式世界地图上查看全球多个城市的实时时间，并实时显示日夜终止线。

![ZoneMap 截图](public/screenshot.png)

## 功能

- **实时世界时钟** — 在每分钟整点精确更新，无漂移
- **交互式地图** — Mercator 投影，带国家轮廓和城市标记
- **日夜终止线** — 基于天文算法精确计算的太阳边界，渲染在 Canvas 图层上
- **城市卡片** — 添加/移除城市，点击设置基准时区
- **时间滑块** — 拖动滑块或手动输入时间，探索一天中的任意时刻
- **12h / 24h 切换** — 同步应用于卡片、地图标签和时间输入
- **URL 状态同步** — 可分享或收藏特定视图，刷新后自动恢复
- **32,000+ 城市搜索** — 基于 GeoNames 数据集，按时区去重

## 快速开始

```bash
pnpm install
pnpm run setup           # 复制世界地图数据到 public/
pnpm run build:geonames  # 构建城市搜索数据集
pnpm run dev             # http://localhost:5173
```

## 命令

| 命令 | 说明 |
|---|---|
| `pnpm run dev` | 启动开发服务器（前端 + API） |
| `pnpm run build` | 类型检查 + 生产构建 |
| `pnpm run preview` | 预览生产构建 |
| `pnpm run lint` | 运行 ESLint |
| `pnpm run setup` | 复制世界地图 TopoJSON 到 `public/` |
| `pnpm run build:geonames` | 从 GeoNames 构建城市搜索数据集 |
| `pnpm start` | 启动生产服务器 |

## 技术栈

| | |
|---|---|
| 前端 | React 18 + TypeScript（严格模式） |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion 11 |
| 时间 | date-fns + date-fns-tz |
| 地理 | D3-geo + topojson-client + world-atlas |
| 后端 | Hono + Node.js |

## 项目结构

```
src/
├── App.tsx              # 根组件状态 + URL 同步
├── types/index.ts       # 共享 TypeScript 接口
├── data/cities.ts       # 默认显示的城市列表
├── utils/
│   ├── terminator.ts    # 日夜终止线天文计算（USNO 算法）
│   ├── timeUtils.ts     # 时区格式化工具
│   └── mapUtils.ts      # Mercator 投影工具
├── hooks/
│   ├── useClock.ts      # 无漂移的分钟级时钟
│   └── useUrlSync.ts    # 防抖的 URL 状态同步
└── components/
    ├── cards/           # CityCard、CityCardRow、AddCityButton
    ├── map/             # WorldMap、MapBackground、CityMarkers、TerminatorCanvas
    ├── controls/        # TimeControl、TimeInput、TimeSlider
    └── search/          # CitySearch 搜索弹层
api/
├── server.ts            # Hono 服务器 — 同时提供 API 和前端静态文件
├── routes/cities.ts     # 城市搜索接口（含 GeoNames 数据集）
└── middleware/          # 限速、CORS
```

## 添加城市

搜索框直接查询 GeoNames 数据集中的 32,000+ 个城市。若要将城市硬编码为初始默认显示，在 `src/data/cities.ts` 的 `ALL_CITIES` 中添加条目：

```ts
{
  id: 'city-slug',
  name: '城市名',
  country: '国家',
  countryCode: 'ISO 代码',
  timezone: 'Region/City',   // IANA 时区标识符
  lat: 0.0,
  lng: 0.0,
}
```

## 许可证

[MIT](LICENSE)
