# EasyIRR 模块

## 模块职责

easyirr 提供面向 YAML 的 AS-SET 组装与刷新抽象，并可映射到 core 的 IRR 对象。

## 入口文件

- `src/easyirr/AS_SET/index.ts`

## 典型流程

1. 使用 `parseContent` 解析 YAML。
2. 把内容注册到 `EasyASSetObject`。
3. 调用 `refreshAll()` 生成并应用 patch。
4. 将结果对象交给 core IRR manager 或 syncer。

## 依赖关系

- 依赖 `src/core/IRR/AS_SET/*` 作为标准对象与内容模型。
- 在成员处理中可依赖 `src/irrd-client` 进行远端展开。
