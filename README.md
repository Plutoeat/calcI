# calcI

贷款年化与现金流计算工具，当前是一个可直接部署到 GitHub Pages 的静态前端应用。

## 功能

- `快速估算`：只输入实际到手金额、期数、每期还款、最后一期额外还款，快速估算 `APR`、`IRR`、真实年化和总成本
- `高级核验`：支持 `等额本息`、`等额本金`、`等本等息`、`先息后本`、`一次性还本付息`
- 支持把 `前置费用`、`月服务费`、`提前结清违约金` 计入真实成本
- 输出逐期还款表、余额变化、成本拆分以及 `XIRR` 年化

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run test   # 运行测试
npm run build  # 生产构建
```

默认开发服务由 Vite 提供；如果你本地改了仓库名或部署路径，记得同步检查 `vite.config.ts` 的 `base` 配置。

## 部署

仓库已包含 `.github/workflows/deploy.yml`。推送到默认分支后，可以通过 GitHub Pages 自动部署。

## 注意

- 不要提交 `.env`、本地证书、日志和其他机器相关文件
- `dist/`、`node_modules/`、编辑器配置和系统缓存已经加入 `.gitignore`
