# Access Control 模块

## 模块职责

access-control 是与框架无关的授权核心模块，由 HTTP API 与 WHOIS 共享。

## 覆盖范围

- Scope 与角色定义。
- 有效鉴权上下文构建。
- 资源级权限匹配与断言。
- 权限域错误类型（`AccessControlError`）。

## 集成关系

- `src/server/http-api/auth` 依赖本模块，并把错误映射为 `HttpError`。
- `src/server/whois` 直接依赖本模块进行内部用户过滤。

## 约束说明

- 该模块保持传输层无关。
- 不要引入 Fastify、HTTP 协议或 token 校验逻辑。
