<div align="center">

# 🌊 Signal Playground

**Interactive signal & spectrum visualizer for EE / CS learners and researchers.**
**面向电子 / 计算机方向同学的交互式信号与频谱可视化平台。**

[**🔗 Live Demo · 在线体验**](https://signal-playground.vercel.app/) &nbsp;·&nbsp;
[**📖 Architecture · 架构**](ARCHITECTURE.md) &nbsp;·&nbsp;
[**🤝 Contributing · 参与贡献**](CONTRIBUTING.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built_with-Vite-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Plotly](https://img.shields.io/badge/Plot-Plotly.js-3F4F75.svg?logo=plotly&logoColor=white)](https://plotly.com/javascript/)
[![KaTeX](https://img.shields.io/badge/Math-KaTeX-329F75.svg)](https://katex.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

> 🌐 **English** · [中文](#-中文版)

---

## ✨ Why Signal Playground?

Most DSP textbooks stop at static plots; most online tools either hide the math or hide the buttons. **Signal Playground** sits in the middle: every transform shows its LaTeX definition, every signal is a live function of your parameters, and every result is one click away from a shareable link.

- 🧪 **Continuous & Discrete**: switch between $x(t)$ and $x[n]$; transforms are auto-filtered for compatibility.
- ✏️ **LaTeX formula source**: type `\sin(2\pi \cdot 5 t) + e^{-t}` and watch it render, sample, transform — instantly.
- 🔁 **11 built-in transforms**: DFT/FFT · DTFT · DFS · DCT-II · DST-I · CTFT · CTFS · STFT · Hilbert · Z-Transform · Laplace.
- 📚 **Cheatsheet drawer**: definitions, properties and common pairs, all KaTeX-rendered.
- 📐 **Live transform info**: every transform tells you its math, its input requirements, its output meaning, and its common pitfalls.
- 🎚️ **Slider + numeric input**: coarse with a slider, fine-tune with a textbox, even values outside the slider range.
- 🪟 **4 windows**: Rectangular · Hann · Hamming · Blackman.
- 🎓 **10 teaching presets**: aliasing · beat frequency · square-wave spectrum · chirp spectrogram · DCT compaction · DTFT vs DFT · Hilbert envelope · Z-plane surface, …
- 🌐 **Built-in i18n**: full English / 中文 UI; toggled in the header, persisted in `localStorage`.
- 🔗 **Shareable URL snapshots**: one click copies a link reproducing the exact configuration.
- 💾 **Export plots as PNG, data as CSV**.
- 🔌 **Plugin architecture**: add a new transform by writing one file (no UI changes required).
- 🖼️ **100% in-browser**: no backend, no data leaves your machine.

<br>

## 🚀 Quick Start

```bash
# 1) Install
npm install

# 2) Run dev server (opens http://localhost:5173)
npm run dev

# 3) Production build
npm run build

# 4) Preview the production bundle locally
npm run preview
```

> **Tip · Online demo**: [https://signal-playground.vercel.app/](https://signal-playground.vercel.app/) — no install, just open and play.
>
> The repo also ships a GitHub Pages workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). Forking the repo and enabling Pages will publish the build to `https://<your-username>.github.io/signal-playground/` automatically.

<br>

## 🧭 What's inside

```
DataSource ──▶ Window ──▶ Transform ──▶ Visualizer
   sine        Hann        DFT           LinePlot
```

Everything is a **plugin** registered into a central `Registry`. Adding a new transform = writing one TypeScript file and exporting it. The UI auto-generates parameter controls from the schema.

| Concept | Where | What it does |
|---|---|---|
| `IDataSource` | `src/domains/signal/sources/` | Produces a `DataBuffer` from parameters (sine, formula, chirp…). |
| `ITransform` | `src/domains/signal/transforms/` | Pure function `DataBuffer → DataBuffer \| ComplexBuffer`. |
| `IWindow` | `src/domains/signal/windows/` | Generates a length-N coefficient array. |
| `IPreset` | `src/domains/signal/presets/` | Materialises a teaching scenario into a full pipeline config. |
| `IVisualizer` | `src/visualizers/` | Renders a buffer (line plot, heatmap, …). |

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full picture and [`CONTRIBUTING.md`](CONTRIBUTING.md) for "add a transform in 5 minutes".

<br>

## 🎯 Use Cases

- 🎓 **Signals & Systems / DSP coursework** — stop guessing what the spectrum *should* look like; just see it.
- 🔬 **Quick sanity checks while writing papers** — type the equation, eyeball the spectrum.
- 📊 **Publication-ready figures** — PNG export at 1200×600 with the dark theme.
- 👨‍🏫 **Classroom demos** — share a single URL and the whole class lands on the same configuration.
- ✏️ **Exam revision** — flip through the cheatsheet drawer, run a preset, tweak parameters.

<br>

## 🗺 Roadmap

### v0.1 — Signal MVP ✅
- DFT / DCT / STFT
- 7 sources, 4 windows, 5 presets
- PNG + CSV export

### v0.2 — Education Power-Up ✅
- Continuous / Discrete switcher with compatibility filtering
- LaTeX formula source (KaTeX preview + mathjs evaluation)
- DTFT, DFS, DST, CTFT, CTFS, Hilbert, Z-Transform, Laplace
- Cheatsheet drawer (definitions / properties / pairs)
- Live TransformInfo card (formula + teaching hints)
- Shareable URL snapshots
- Full English / 中文 i18n

### v0.3 — Image Domain 🖼
- 2D-DFT / 2D-DCT (JPEG-style block compression demo)
- Image upload & synthetic patterns
- Frequency-domain filtering playground

### v0.4 — Filter Lab
- FIR / IIR designers with Bode plot
- DWT (Daubechies, Haar)

### v0.5 — Communication
- AM / FM / PSK modulators
- Constellation & eye diagrams

### v1.0
- Web Audio real-time input
- Plugin marketplace

<br>

## 🛠 Tech Stack

|  |  |
|---|---|
| Language | TypeScript 5 |
| Build | Vite 5 |
| Math eval | [mathjs](https://mathjs.org/) (LaTeX → mathjs preprocessor) |
| Math render | [KaTeX](https://katex.org/) |
| FFT | [fft.js](https://github.com/indutny/fft.js) (radix-2 Cooley–Tukey) |
| Plotting | [Plotly.js](https://plotly.com/javascript/) (WebGL traces) |
| Architecture | Plugin registry + schema-driven UI |
| Hosting | Static (works on GitHub Pages, Vercel, Netlify, Cloudflare Pages) |

<br>

## 🤝 Contributing

Contributions are very welcome — especially **new transforms, sources, or visualizers**. The plugin model means most additions are a single file plus a one-line registration. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the 5-minute walkthrough.

<br>

## 📜 License

[MIT](LICENSE) © 2026 Signal Playground contributors. Built with ❤ for the EE/CS community.

<br>

---

<a id="-中文版"></a>

# 🌊 Signal Playground · 中文版

**面向 EE / CS 学习者与研究者的交互式信号 / 频谱可视化平台。**

> 🔗 在线体验：[https://signal-playground.vercel.app/](https://signal-playground.vercel.app/)

## ✨ 项目亮点

教科书的频谱图都是静态的，在线工具又往往把数学藏起来。**Signal Playground** 想做中间那一层：每个变换都给出 LaTeX 定义，每个信号都是参数的实时函数，每个结果都能一键生成可分享的链接。

- 🧪 **连续 / 离散双模式**：在 $x(t)$ 与 $x[n]$ 之间一键切换，变换列表会自动按兼容性过滤。
- ✏️ **LaTeX 公式信号源**：直接键入 `\sin(2\pi \cdot 5 t) + e^{-t}`，KaTeX 实时渲染，mathjs 即时求值。
- 🔁 **内置 11 种变换**：DFT/FFT · DTFT · DFS · DCT-II · DST-I · CTFT · CTFS · STFT · 希尔伯特 · Z 变换 · 拉普拉斯。
- 📚 **公式速查表抽屉**：定义、性质、常用变换对，全部 KaTeX 美化。
- 📐 **变换信息卡片**：当前变换的数学定义、输入要求、输出语义、易错点一目了然。
- 🎚️ **滑块 + 数字输入双控**：滑块粗调，文本框精调，文本框还支持超出滑块的取值。
- 🪟 **4 种窗函数**：矩形 / Hann / Hamming / Blackman。
- 🎓 **10 个教学预设**：混叠演示、拍频、方波频谱、Chirp 频谱图、DCT 能量集中、DTFT vs DFT、希尔伯特包络、Z 平面曲面 …
- 🌐 **内置中英双语 i18n**：右上角一键切换，`localStorage` 自动记忆。
- 🔗 **URL 快照分享**：一键复制能完整复现当前配置的链接。
- 💾 **图表导出 PNG，数据导出 CSV**。
- 🔌 **插件式架构**：新增变换只需新建一个文件，UI 完全自动适配。
- 🖼️ **完全运行在浏览器**：无后端，数据不离开本地。

<br>

## 🚀 快速开始

```bash
# 1) 安装依赖
npm install

# 2) 启动开发服务（自动打开 http://localhost:5173）
npm run dev

# 3) 生产环境构建
npm run build

# 4) 本地预览构建产物
npm run preview
```

> **在线试用**：直接打开 [https://signal-playground.vercel.app/](https://signal-playground.vercel.app/)，无需任何安装。
>
> 仓库自带 GitHub Pages 部署工作流（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）。Fork 后开启 Pages 即可自动发布到 `https://<你的用户名>.github.io/signal-playground/`。

<br>

## 🧭 项目结构概览

```
DataSource ──▶ Window ──▶ Transform ──▶ Visualizer
   信号源       窗函数       变换           可视化器
```

所有模块都是注册到中央 `Registry` 的**插件**。新增一个变换 = 写一个 TypeScript 文件并导出。UI 会根据参数 schema 自动生成控件。

| 概念 | 位置 | 作用 |
|---|---|---|
| `IDataSource` | `src/domains/signal/sources/` | 由参数生成 `DataBuffer`（正弦、公式、Chirp …）。 |
| `ITransform` | `src/domains/signal/transforms/` | 纯函数：`DataBuffer → DataBuffer \| ComplexBuffer`。 |
| `IWindow` | `src/domains/signal/windows/` | 输出长度为 N 的窗函数系数。 |
| `IPreset` | `src/domains/signal/presets/` | 把一个教学场景固化为完整管线配置。 |
| `IVisualizer` | `src/visualizers/` | 把缓冲区渲染成图（折线图、热力图 …）。 |

更多细节见 [`ARCHITECTURE.md`](ARCHITECTURE.md)；想动手贡献，请看 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

<br>

## 🎯 适用场景

- 🎓 **信号与系统 / DSP 课程**：不再凭空猜频谱，直接动手看。
- 🔬 **写论文时的快速验证**：把公式键进去，瞄一眼频谱就行。
- 📊 **生成可发表的高清图**：PNG 1200×600，暗色主题。
- 👨‍🏫 **课堂演示**：分享一个 URL，全班同学瞬间落到同一份配置上。
- ✏️ **复习备考**：打开速查表抽屉，加载预设，调参对比。

<br>

## 🗺 路线图

### v0.1 — 信号 MVP ✅
- DFT / DCT / STFT
- 7 种信号源，4 种窗函数，5 个预设
- PNG + CSV 导出

### v0.2 — 教学增强 ✅
- 连续 / 离散切换器与兼容性过滤
- LaTeX 公式信号源（KaTeX 预览 + mathjs 求值）
- DTFT、DFS、DST、CTFT、CTFS、希尔伯特、Z 变换、拉普拉斯
- 公式速查表抽屉（定义 / 性质 / 变换对）
- 变换信息卡片（公式 + 教学提示）
- URL 快照分享
- 完整中英双语 i18n

### v0.3 — 图像域 🖼
- 2D-DFT / 2D-DCT（JPEG 风格分块压缩演示）
- 图像上传 & 合成图样
- 频域滤波 Playground

### v0.4 — 滤波器实验室
- FIR / IIR 设计器与 Bode 图
- 离散小波（Daubechies、Haar）

### v0.5 — 通信
- AM / FM / PSK 调制
- 星座图 & 眼图

### v1.0
- Web Audio 实时输入
- 插件市场

<br>

## 🛠 技术栈

|  |  |
|---|---|
| 语言 | TypeScript 5 |
| 构建 | Vite 5 |
| 数学求值 | [mathjs](https://mathjs.org/)（自带 LaTeX → mathjs 预处理器） |
| 公式渲染 | [KaTeX](https://katex.org/) |
| FFT | [fft.js](https://github.com/indutny/fft.js)（基-2 Cooley–Tukey） |
| 绘图 | [Plotly.js](https://plotly.com/javascript/)（WebGL trace） |
| 架构 | 插件注册中心 + Schema 驱动 UI |
| 部署 | 静态托管（GitHub Pages / Vercel / Netlify / Cloudflare Pages 都可） |

<br>

## 🤝 参与贡献

非常欢迎贡献，尤其是 **新变换、新信号源、新可视化器**。插件式架构意味着大多数新增功能只需一个文件 + 一行注册代码。详细步骤见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

<br>

## 📜 开源协议

[MIT](LICENSE) © 2026 Signal Playground 贡献者。为 EE/CS 社区用 ❤ 打造。
