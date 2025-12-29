# JARVIS 手势识别交互系统

<div align="center">

## 🚀 像钢铁侠一样用手势控制3D地球！

一个高科技感的手势识别交互程序，完美还原贾维斯（JARVIS）风格界面

![JARVIS System](https://img.shields.io/badge/Status-Ready-success?style=for-the-badge)
![Tech](https://img.shields.io/badge/Tech-MediaPipe%20%2B%20Three.js-blue?style=for-the-badge)
![FPS](https://img.shields.io/badge/FPS-60-green?style=for-the-badge)

</div>

---

## ✨ 功能特性

### 🖐️ 手势控制

- **左手（1-4数字）** - 切换地球形态
  - 1️⃣ 标准视图
  - 2️⃣ 线框模式  
  - 3️⃣ 点云模式
  - 4️⃣ 全息投影

- **右手（开合手掌）** - 控制缩放
  - ✋ 张开 = 缩小
  - ✊ 握紧 = 放大

### 🎨 JARVIS风格界面

- 青色/蓝色科技感配色
- 霓虹发光效果
- 四角HUD实时状态显示
- 扫描线动画
- 六边形网格背景

### 🌍 3D地球渲染

- 高质量球体模型
- 大气层光晕效果
- 平滑缩放和旋转
- 四种可切换形态

### 👁️ 手部骨骼追踪

- 实时显示21个关键点
- 青色/金色发光骨骼
- 零延迟响应（~50ms）

---

## 🚀 快速开始

### 1. 启动服务器

```bash
# 进入项目目录
cd jarvis-gesture

# 启动本地服务器
npx -y serve .

# 或使用Python
python -m http.server 3000
```

### 2. 打开浏览器

访问 `http://localhost:3000`

### 3. 允许摄像头权限

首次使用需要允许浏览器访问摄像头

### 4. 开始使用

伸出你的手，享受科技感十足的交互体验！

---

## 🎯 操作指南

### 手势控制

| 手势 | 动作 | 效果 |
|------|------|------|
| 左手食指 | 伸出1根手指 | 切换到标准视图 |
| 左手剪刀手 | 伸出2根手指 | 切换到线框模式 |
| 左手OK反向 | 伸出3根手指 | 切换到点云模式 |
| 左手四指 | 伸出4根手指 | 切换到全息投影 |
| 右手张开 | 五指展开 | 缩小地球 |
| 右手握拳 | 握紧拳头 | 放大地球 |

### 键盘快捷键（调试）

- `1-4` 键：快速切换形态
- `+/-` 键：调整缩放

---

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + JavaScript
- **3D渲染**: [Three.js](https://threejs.org/) v0.159.0
- **手势识别**: [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- **摄像头**: WebRTC API

---

## 📁 项目结构

```
jarvis-gesture/
├── index.html              # 主页面
├── styles.css              # JARVIS风格样式
├── HandGestureDetector.js  # 手势识别核心
├── EarthRenderer.js        # 3D地球渲染
├── JarvisUI.js            # UI控制模块
└── app.js                 # 主应用协调器
```

---

## ⚡ 性能指标

| 指标 | 数值 |
|------|------|
| 帧率 | 30-60 FPS |
| 手势延迟 | ~50ms |
| 缩放方式 | 平滑插值 |
| 内存占用 | 正常 |

---

## 🌐 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome | ✅ 推荐 |
| Edge | ✅ 推荐 |
| Firefox | ✅ 支持 |
| Safari | ⚠️ 需测试 |

---

## 🎬 演示

系统包含以下界面元素：

- **左上角**: 系统状态（摄像头、追踪、FPS、时间）
- **右上角**: 地球控制（形态、缩放、旋转）
- **左下角**: 左手手势状态和模式指示器
- **右下角**: 右手手势状态和开合度
- **中央**: 3D地球实时渲染
- **顶部**: JARVIS标题和副标题

---

## 🔧 自定义配置

### 修改颜色主题

编辑 `styles.css` 中的CSS变量：

```css
:root {
    --primary-cyan: #00ffff;    /* 主色调 */
    --primary-blue: #0080ff;    /* 次要色 */
    --accent-gold: #ffd700;     /* 强调色 */
}
```

### 调整手势灵敏度

编辑 `HandGestureDetector.js`：

```javascript
// 修改检测置信度
minDetectionConfidence: 0.7,  // 降低可提高灵敏度
minTrackingConfidence: 0.7    // 降低可提高灵敏度
```

### 修改地球缩放范围

编辑 `EarthRenderer.js`：

```javascript
// 修改缩放范围
this.targetScale = 0.5 + (1 - openness) * 1.5; 
// 范围：0.5到2.0，可自行调整
```

---

## 🎨 四种地球形态

1. **标准视图** - 完整地球纹理 + 大气层
2. **线框模式** - 青色线框，科技感
3. **点云模式** - 发光粒子云
4. **全息投影** - 半透明发光，科幻效果

---

## 💡 使用提示

1. **光照条件**: 确保足够的光线，提高手势识别准确率
2. **手部位置**: 保持手在摄像头画面中央区域
3. **背景环境**: 简洁背景有助于提高识别精度
4. **手势清晰**: 做手势时尽量清晰、标准
5. **单手操作**: 左右手分别控制不同功能，可同时使用

---

## 🐛 常见问题

### Q: 摄像头无法启动？
A: 请检查浏览器权限设置，确保允许访问摄像头

### Q: 手势识别不准确？
A: 确保光线充足，手势清晰标准，背景简洁

### Q: FPS太低？
A: 关闭其他耗资源应用，或降低检测精度

### Q: 地球不显示？
A: 检查Three.js是否正确加载，查看浏览器控制台错误

---

## 📝 更新日志

### v1.0.0 (2025-12-28)
- ✅ 完整JARVIS风格界面
- ✅ 左手1-4数字识别
- ✅ 右手开合缩放控制
- ✅ 四种地球形态
- ✅ 手部骨骼追踪
- ✅ 实时状态显示

---

## 📄 许可证

本项目仅供学习和演示使用

---

## 🙏 致谢

- [Three.js](https://threejs.org/) - 3D渲染引擎
- [MediaPipe](https://google.github.io/mediapipe/) - 手势识别
- [Marvel/Iron Man](https://www.marvel.com/) - JARVIS界面灵感

---

<div align="center">

**享受你的JARVIS系统！** 🚀

Made with ❤️ by Antigravity AI

</div>
