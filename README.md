# ✨ 3D 粒子系统 · 实时手势交互

## How to Run

### Docker 启动（推荐）

```bash
# 克隆项目后在根目录执行
docker-compose up --build -d

# 浏览器访问
open http://localhost:8081
```

> 停止服务：`docker-compose down`

### 本地启动（不用 Docker）

应用依赖 Three.js 与 MediaPipe，需先将它们从 `node_modules` 复制到 `vendor/`，随后用任意静态服务器托管即可。

**一键启动（推荐）**

```bash
cd Frontend
npm run dev          # 等价于: npm install + 复制 vendor + npx serve . -p 8081
```

**分步操作**

```bash
cd Frontend
npm run setup        # 安装依赖并将库文件复制到 vendor/
python -m http.server 8081   # 或 npx serve . -p 8081
```

> **注意**：摄像头手势功能需要在 `localhost` 或 `https://` 环境下使用（浏览器安全限制）。

### 测试

```bash
cd Frontend
npm install        # 已执行过 setup 可跳过
npm test           # 一次性运行（vitest run）
npm run test:watch # 监听模式，文件改动自动重跑
```

覆盖范围：`shapes.js`（三种形状生成器）和 `state.js`（默认状态），共 **19 个测试用例**，全为纯逻辑、无 DOM / WebGL 依赖。

---

## Services

| 服务名称 | 容器端口 | 宿主机端口 | 说明 |
|---|---|---|---|
| `frontend` | 80 | **8081** | 静态 HTML 应用，由 nginx:alpine 提供服务 |

**技术栈**：
- **Three.js** (r160) — WebGL 3D 渲染引擎
- **MediaPipe Hands** — 实时手部关键点检测
- **nginx:alpine** — 多平台静态文件服务（支持 ARM64 / x86_64）

**构建说明**：`Dockerfile` 采用多阶段构建，第一阶段使用 `node:20-alpine` 对 HTML 进行压缩编译，第二阶段使用跨平台 `nginx:alpine` 镜像提供服务，同时支持 `linux/amd64` 与 `linux/arm64`。

---

## 测试账号

本项目为纯前端应用，无需注册或登录，无测试账号。

---

## 题目内容

用Three.js创建一个实时交互的3D粒子系统。 
1.通过摄像头检测单手张合控制粒子群的缩放与 
扩散 
2.提供UI面板可选择爱心/花朵/土星/烟花 
等模型 
3.支持颜色选择器调整粒子颜色 
4.粒子需实时响应手势变化 
5.界面简洁现代，包含全屏控制按钮。

---

## 项目介绍

### 功能特性

- **4000 粒子实时渲染**：基于 Three.js `BufferGeometry` 与 `AdditiveBlending` 混合模式，产生自然的粒子辉光效果
- **四种粒子形态**：
  - **爱心**：经典心形参数曲线，带轻微 Z 向厚度
  - **花朵**：六瓣玫瑰曲线（`|cos(3θ)|`），花蕊与花瓣分层分布
  - **土星**：球体 + 多环带（C/B/A 环 + Cassini 缝隙），环面倾斜 40°
  - **烟花**：物理模拟粒子（重力 + 阻尼 + 周期爆炸），彩虹色动态渲染
- **手势控制**：MediaPipe Hands 实时检测手掌张合度，映射到 0.32× ～ 2.8× 粒子缩放比例
- **平滑过渡**：形状切换时粒子从当前位置平滑插值收敛到目标形状
- **背景星空**：1400 颗随机星粒点缀三维空间
- **交互控制**：鼠标拖拽旋转、滚轮缩放、触屏捏合缩放、可切换自动旋转

### 界面截图功能

| 区域 | 功能 |
|---|---|
| 右侧控制面板 | 形状选择、颜色调整、缩放滑块、手势状态 |
| 左下角 | 摄像头实时预览 + 手骨架可视化 |
| 右上角 | 全屏切换按钮 |
