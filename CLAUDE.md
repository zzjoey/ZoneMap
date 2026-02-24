# CLAUDE.md

这个文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

ZoneMap 是一个精密的时区可视化 Web 应用，允许用户:
- 查看全球多个城市的实时时间
- 在交互式世界地图上可视化时区
- 查看日夜终止线的实时天体计算
- 在时间之间进行手动导航
- 通过 URL 状态持久化和分享配置

## 技术栈

- **框架**: React 18.3.1 + TypeScript (严格模式)
- **构建**: Vite 5.3.4 (使用智能代码分割)
- **样式**: Tailwind CSS 3.4.7
- **动画**: Framer Motion 11.3.0
- **时间**: date-fns + date-fns-tz (IANA 时区支持)
- **地理**: D3-geo + topojson-client + world-atlas (Mercator 投影)

## 开发命令

```bash
# 首次设置 - 复制世界地图数据到 public 目录
npm run setup

# 开发服务器
npm run dev

# 类型检查 + 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 架构概览

### 核心状态管理
应用使用简单的 React 状态 + URL 同步，集中在 `src/App.tsx`:
- `cities[]` - 当前显示的城市列表
- `baseCity` - 基准时间城市
- `isLiveMode` - 实时 vs 手动时间模式
- `manualTime` - 手动设置的时间
- `baseTime` - 有效的基准时间 (实时或手动)

### 关键技术实现

**时间精确性**:
- `useClock` hook 在每分钟边界精确更新 (避免漂移)
- 所有时区计算使用 IANA 标识符通过 date-fns-tz
- URL 状态防抖同步 (500ms) 支持时间滑块拖拽

**日夜终止线**:
- `src/utils/terminator.ts` 包含复杂的天体计算
- 实现简化的 USNO 太阳赤纬算法
- 使用 Canvas ImageData 的高性能像素渲染
- 支持暮光区域的渐变过渡

**地图投影**:
- D3-geo Mercator 投影在 `src/utils/mapUtils.ts`
- 投影和逆投影函数用于坐标转换
- 支持交互式城市点击和标记

### 目录结构

```
src/
├── App.tsx              # 主应用组件和状态管理
├── types/index.ts       # TypeScript 类型定义
├── data/cities.ts       # 70+ 个全球城市数据
├── utils/
│   ├── terminator.ts    # 日夜边界天体计算
│   ├── timeUtils.ts     # 时区转换和格式化
│   └── mapUtils.ts      # 地图投影函数
├── hooks/
│   ├── useClock.ts      # 精确的分钟边界时钟
│   └── useUrlSync.ts    # 防抖的 URL 状态同步
└── components/
    ├── layout/          # AppShell 布局容器
    ├── cards/           # 城市时间卡片和行
    ├── map/             # WorldMap, TerminatorCanvas, CityMarkers
    ├── controls/        # 时间输入、滑块和控制
    ├── timeline/        # 工作时间可视化
    └── search/          # 城市搜索叠加层
```

## 开发指南

### 添加新城市
在 `src/data/cities.ts` 中的 `ALL_CITIES` 数组添加条目:
```typescript
{
  id: 'city-slug',
  name: '城市名',
  country: '国家',
  countryCode: 'ISO代码',
  timezone: 'IANA/时区',
  lat: 纬度,
  lng: 经度
}
```

### 修改时间格式
时间格式化在 `src/utils/timeUtils.ts` 中集中管理。所有函数都接受 Date 和时区参数。

### 地图定制
- 地图投影设置在 `src/utils/mapUtils.ts` 的 `createMercatorProjection`
- 终止线外观在 `src/utils/terminator.ts` 的 `drawTerminator` 中可调整
- 世界地图数据来自 `public/world-110m.json` (通过 `npm run setup` 设置)

### 性能注意事项
- 终止线计算是 CPU 密集型 - 避免不必要的重绘
- 时间更新经过优化，只在分钟边界触发
- Vite 构建配置智能分割供应商代码

### 类型系统
所有主要接口在 `src/types/index.ts` 中定义:
- `City` - 核心城市数据结构
- `ProjectFn`/`InverseProjectFn` - 地图投影函数类型
- `UrlState` - URL 序列化结构
- `MapSize` - 地图尺寸接口

## 故障排除

**地图不显示**: 确保运行了 `npm run setup` 复制世界地图数据

**时间不更新**: 检查 `isLiveMode` 状态和 `useClock` hook 的 `isLive` 参数

**投影错误**: 验证坐标在有效的 Mercator 范围内 (纬度 ~±85°)

**构建失败**: 确保所有 TypeScript 类型正确 - 项目使用严格模式