# Syncer 模块

## 模块职责

syncer 定义并实现外部 IRR 同步适配器，用于桥接远端注册系统 API 与本地 core AS-SET 对象。

## 入口文件

- `src/syncer/types.ts`：`Syncer` 接口契约。

## 集成点

- 通过 `Mitei.registerSyncer` 注册。
- 由 `Mitei.syncASSets` 和 HTTP 路由 `POST /api/v1/syncers/:id/sync` 触发。
