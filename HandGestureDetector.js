/**
 * HandGestureDetector.js
 * 手势识别核心模块 - 使用MediaPipe Hands进行手部追踪和手势识别
 */

class HandGestureDetector {
    constructor(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.hands = null;
        this.camera = null;

        // 手势状态
        this.leftHandGesture = null;
        this.rightHandGesture = null;
        this.leftHandNumber = 0;
        this.rightHandOpenness = 0;

        // 回调函数
        this.onLeftHandChange = null;
        this.onRightHandChange = null;
        this.onHandsDetected = null;

        // 初始化MediaPipe
        this.initMediaPipe();
    }

    async initMediaPipe() {
        // 创建Hands实例
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        // 配置Hands参数
        this.hands.setOptions({
            maxNumHands: 2,              // 最多检测2只手
            modelComplexity: 1,          // 模型复杂度（0-2）
            minDetectionConfidence: 0.7, // 最小检测置信度
            minTrackingConfidence: 0.7   // 最小追踪置信度
        });

        // 设置结果回调
        this.hands.onResults((results) => this.onResults(results));
    }

    async startCamera() {
        // 调整canvas尺寸以匹配视频 (HUD模式)
        this.canvas.width = 320;
        this.canvas.height = 240;

        // 创建摄像头
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.hands.send({ image: this.video });
            },
            width: 1280,
            height: 720
        });

        await this.camera.start();
    }

    onResults(results) {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let leftHand = null;
        let rightHand = null;

        if (results.multiHandLandmarks && results.multiHandedness) {
            // 识别左右手
            for (let i = 0; i < results.multiHandedness.length; i++) {
                const handedness = results.multiHandedness[i].label; // "Left" or "Right"
                const landmarks = results.multiHandLandmarks[i];

                // 注意：MediaPipe的Left/Right是镜像的（从摄像头视角）
                if (handedness === 'Right') { // 实际是左手
                    leftHand = landmarks;
                } else { // 实际是右手
                    rightHand = landmarks;
                }
            }

            // 绘制骨骼
            if (leftHand) this.drawHandSkeleton(leftHand, '#00ffff');
            if (rightHand) this.drawHandSkeleton(rightHand, '#ffd700');

            // 1. 双手手势同时识别 (Mode Switching)
            // 只有当双手同时检测到且数字相同时触发
            if (leftHand && rightHand) {
                const leftNum = this.detectHandNumber(leftHand, false); // false = left
                const rightNum = this.detectHandNumber(rightHand, true); // true = right

                // 更新内部状态显示用
                this.leftHandNumber = leftNum;
                this.rightHandGesture = rightNum > 0 ? rightNum.toString() : 'open'; // 简单复用显示逻辑

                if (leftNum > 0 && leftNum === rightNum) {
                    if (this.onDualHandGesture) {
                        this.onDualHandGesture(leftNum);
                    }
                }

                // 2. 双手距离控制缩放 (Distance Scaling)
                const distance = this.calculateHandDistance(leftHand, rightHand);
                if (this.onHandDistance) {
                    this.onHandDistance(distance);
                }
            }

            // 保持单手检测回调以兼容UI显示 (Optional, but good for debugging)
            if (this.onHandsDetected) {
                this.onHandsDetected({
                    leftHand: leftHand !== null,
                    rightHand: rightHand !== null,
                    leftNumber: leftHand ? this.detectHandNumber(leftHand, false) : 0,
                    rightGesture: rightHand ? (this.detectHandNumber(rightHand, true) || 'pose') : null,
                    rightOpenness: 0 // No longer used for zoom
                });
            }

        } else {
            if (this.onHandsDetected) {
                this.onHandsDetected({
                    leftHand: false,
                    rightHand: false,
                    leftNumber: 0,
                    rightGesture: null,
                    rightOpenness: 0
                });
            }
        }
    }

    /**
     * 计算双手距离 (归一化 0-1)
     * 0 = 双手接触 (Min Zoom)
     * 1 = 双手远离 (Max Zoom)
     */
    calculateHandDistance(leftHand, rightHand) {
        // 使用手腕(0)或食指根部(5)作为参考点
        const leftPoint = leftHand[0];
        const rightPoint = rightHand[0];

        // 计算Euclidean距离 (x, y是归一化的 0-1)
        // x轴距离是主要的
        const dx = Math.abs(leftPoint.x - rightPoint.x);
        const dy = Math.abs(leftPoint.y - rightPoint.y); // y轴差异也考虑一点
        const rawDist = Math.sqrt(dx * dx + dy * dy);

        // 映射逻辑
        // 最小距离约 0.05 (手靠在一起)
        // 最大距离约 0.8 (手张开到屏幕边缘)
        const minRaw = 0.05;
        const maxRaw = 0.6; // 不需要完全撑满屏幕

        return Math.min(Math.max((rawDist - minRaw) / (maxRaw - minRaw), 0), 1);
    }

    /**
     * 绘制手部骨骼 - 增强科技感（JARVIS电光蓝风格）
     */
    drawHandSkeleton(landmarks, color) {
        // 强制使用 JARVIS 电光蓝，忽略传入颜色
        const baseColor = '#00F2FF';

        const width = this.canvas.width;
        const height = this.canvas.height;

        // 手部连接关系
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],           // 拇指
            [0, 5], [5, 6], [6, 7], [7, 8],           // 食指
            [0, 9], [9, 10], [10, 11], [11, 12],      // 中指
            [0, 13], [13, 14], [14, 15], [15, 16],    // 无名指
            [0, 17], [17, 18], [18, 19], [19, 20],    // 小指
            [5, 9], [9, 13], [13, 17]                 // 手掌
        ];

        // 创建高频脉冲效果（模拟激光不稳定感）
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 8) * 0.2 + 0.8; // 0.6 - 1.0 快速闪烁

        // 1. 绘制连接线（激光效果）
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            const x1 = startPoint.x * width;
            const y1 = startPoint.y * height;
            const x2 = endPoint.x * width;
            const y2 = endPoint.y * height;

            // 外发光（光晕）
            this.ctx.beginPath();
            this.ctx.strokeStyle = baseColor;
            this.ctx.lineWidth = 6;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = baseColor;
            this.ctx.globalAlpha = 0.4 * pulse;
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();

            // 核心高亮线（激光束）
            this.ctx.beginPath();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 0.9;
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        });

        // 2. 绘制关节节点（六边形/圆形机械结构）
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * width;
            const y = landmark.y * height;
            const isJoint = index === 0 || index % 4 === 0; // 主关节点

            // 绘制节点外圈光晕
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = baseColor;
            this.ctx.fillStyle = baseColor;
            this.ctx.globalAlpha = 0.5;

            this.ctx.beginPath();
            this.ctx.arc(x, y, isJoint ? 10 : 6, 0, 2 * Math.PI);
            this.ctx.fill();

            // 绘制核心发光点
            this.ctx.shadowBlur = 5;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.globalAlpha = 1.0;
            this.ctx.beginPath();
            this.ctx.arc(x, y, isJoint ? 4 : 2, 0, 2 * Math.PI);
            this.ctx.fill();

            // 关键关节添加动态六边形HUD
            if (isJoint) {
                this.ctx.strokeStyle = baseColor;
                this.ctx.lineWidth = 1.5;
                this.ctx.globalAlpha = 0.8;
                this.ctx.shadowBlur = 10;

                this.ctx.beginPath();
                const hexRadius = 16;
                // 让六边形旋转
                const rot = time * (index % 2 === 0 ? 1 : -1);

                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i + rot;
                    const hx = x + Math.cos(angle) * hexRadius;
                    const hy = y + Math.sin(angle) * hexRadius;
                    if (i === 0) this.ctx.moveTo(hx, hy);
                    else this.ctx.lineTo(hx, hy);
                }
                this.ctx.closePath();
                this.ctx.stroke();
            }
        });

        // 重置状态
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * 通用数字检测 (1-4)
     * isRightHand: boolean
     */
    detectHandNumber(landmarks, isRightHand) {
        const fingerTips = [8, 12, 16, 20];
        const fingerBases = [6, 10, 14, 18];
        const thumbTip = 4;
        const thumbBase = 2;

        const fingersExtended = [];

        // 拇指判断 (左右手X方向不同)
        // 左手: Tip.x > Base.x (镜像视角下，左手在左边，拇指向右伸?) 
        // 实际上MediaPipe左手Thumb Tip x < Base x 是伸展? 
        // 简单起见，用 absolute distance
        const thumbExtended = Math.abs(landmarks[thumbTip].x - landmarks[thumbBase].x) > 0.04;

        // 其他四指
        for (let i = 0; i < 4; i++) {
            fingersExtended.push(landmarks[fingerTips[i]].y < landmarks[fingerBases[i]].y - 0.02);
        }

        const extendedCount = fingersExtended.filter(e => e).length;

        // 严格数字定义
        if (extendedCount === 1 && fingersExtended[0]) return 1;
        if (extendedCount === 2 && fingersExtended[0] && fingersExtended[1]) return 2;
        if (extendedCount === 3 && fingersExtended[0] && fingersExtended[1] && fingersExtended[2]) return 3;
        if (extendedCount === 4 && !thumbExtended) return 4;
        // 5 (Open hand for scaling logic maybe? or just default)
        if (extendedCount === 4 && thumbExtended) return 5;

        return 0; // Fist or undefined
    }
}
