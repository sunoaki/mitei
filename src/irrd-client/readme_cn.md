# IRRD Client 模块

## 模块职责

irrd-client 是面向 IRRd 的轻量 GraphQL 客户端封装，主要提供 AS-SET 与维护者相关查询。

## 入口文件

- `src/irrd-client/index.ts`：导出 `IRRD` 类。

## 使用示例

- `src/irrd-client/manual.ts` 提供了最小可运行示例。

## 依赖关系

- 使用 `@apollo/client/core` 与 GraphQL 生态。
- 由 easyirr 成员解析逻辑及其测试调用。
