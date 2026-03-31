# Server 模块

## 模块职责

server 将 Mitei 能力暴露为服务接口：

- HTTP API（Fastify + 鉴权 + RBAC/资源规则）
- WHOIS 服务（TCP 文本查询协议）

## 子模块

- `src/server/http-api`
    - `index.ts`：独立 HTTP 进程入口。
    - `server.ts`：装配 `Mitei`、鉴权插件、用户仓库和路由。
    - `auth/*`：Token 校验、Scope 计算、权限检查。
    - `user/*`：用户 CRUD、角色/权限管理、持久化。
    - `resources/*`：同步器与 IRR 对象相关 API。
- `src/server/whois`
    - `index.ts`：WHOIS 查询解析与 selector 执行。
    - `manual.ts`：基于测试库的本地启动示例。

## HTTP 鉴权模型

1. 校验 bearer token。
2. 用 token 主体映射本地用户。
3. 计算有效 scope（角色 + grant - deny，并与 token scope 取交集）。
4. 同时校验全局 scope 与对象级资源规则。
