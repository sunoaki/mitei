# Mitei AGENTS 指南

本文档用于帮助编码 agents 快速理解项目结构并定位修改点。

## 总体架构

- 核心领域引擎：`src/core`
- 面向 YAML 的 AS-SET 组装：`src/easyirr`
- IRRd GraphQL 适配：`src/irrd-client`
- 共享权限核心：`src/access-control`
- 服务层：`src/server`（HTTP API + WHOIS）
- 外部注册系统适配：`src/syncer`
- 共享测试工具：`src/test-utils`

## 模块依赖关系

- `src/core` 仅依赖 `src/syncer/types.ts` 的接口定义。
- `src/easyirr` 依赖 `src/core`，成员处理中可使用 `src/irrd-client`。
- `src/access-control` 保持与框架无关，集中承载授权逻辑。
- `src/server/http-api` 依赖 `src/core`、`src/access-control` 与 auth/user 子系统。
- `src/server/whois` 依赖 `src/core/IRR/manager/selector` 与 `src/access-control`。
- `src/syncer` 依赖 core 的 IRR 对象类型。

## 按任务定位入口

- 修改 IRR 对象行为：
    - `src/core/IRR/AS_SET/*`
    - `src/core/IRR/manager/manager.ts`
- 修改同步逻辑：
    - `src/core/index.ts`
    - `src/syncer/types.ts`
    - `src/syncer/ARIN/arin-client.ts`
- 修改授权与资源规则逻辑：
    - `src/access-control/*`
- 修改 HTTP API/鉴权：
    - `src/server/http-api/server.ts`
    - `src/server/http-api/auth/*`
    - `src/server/http-api/resources/index.ts`
    - `src/server/http-api/user/*`
- 修改 WHOIS 行为：
    - `src/server/whois/index.ts`

## 常用验证命令

- 全量测试：`yarn test`
- 相关测试：`yarn test:related`
- 代码检查：`yarn lint`
- 构建：`yarn build`

## 模块中英文文档

- `src/core/readme.md` / `src/core/readme_cn.md`
- `src/easyirr/readme.md` / `src/easyirr/readme_cn.md`
- `src/irrd-client/readme.md` / `src/irrd-client/readme_cn.md`
- `src/access-control/readme.md` / `src/access-control/readme_cn.md`
- `src/server/readme.md` / `src/server/readme_cn.md`
- `src/syncer/readme.md` / `src/syncer/readme_cn.md`
- `src/test-utils/readme.md` / `src/test-utils/readme_cn.md`

## Agent 修改注意事项

- 非明确需求时，尽量保持 TypeScript 对外 API 稳定。
- 修改 core manager 时，避免破坏 selector 与索引一致性。
- 修改 auth 时，同时检查 scope 规则与资源规则。
- 优先同步更新对应模块 `__tests__` 下的测试。
