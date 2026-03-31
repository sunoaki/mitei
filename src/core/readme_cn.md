# Core 模块

## 模块职责

core 是内存中的 IRR 领域引擎，负责对象注册、索引、查询与同步编排。

## 入口文件

- `src/core/index.ts`：导出顶层编排类 `Mitei`。

## 内部数据流

1. `Mitei.registerSyncer(name, syncer)` 注册同步器。
2. `Mitei.syncASSets(syncerId)` 对比远端与本地 AS-SET。
3. 依据更新时间决定上传本地或回补本地。
4. `IRRManager` 持续维护索引，保证查询性能。

## 依赖关系

- 运行时依赖 `src/syncer/types.ts` 中的 `Syncer` 接口。
- 被 `src/server/http-api` 与 `src/server/whois` 消费。
