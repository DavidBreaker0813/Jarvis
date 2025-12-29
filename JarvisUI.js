/**
 * JarvisUI.js
 * JARVIS UI控制模块 - 管理HUD界面元素和状态显示
 */

class JarvisUI {
    constructor() {
        // 获取所有UI元素
        this.elements = {
            // 系统状态
            cameraStatus: document.getElementById('cameraStatus'),
            trackingStatus: document.getElementById('trackingStatus'),
            fpsCounter: document.getElementById('fpsCounter'),
            timestamp: document.getElementById('timestamp'),

            // 地球控制
            earthMode: document.getElementById('earthMode'),
            zoomLevel: document.getElementById('zoomLevel'),
            rotationSpeed: document.getElementById('rotationSpeed'),

            // 左手手势
            leftHandIcon: document.getElementById('leftHandIcon'),
            leftHandNumber: document.getElementById('leftHandNumber'),
            leftHandStatus: document.getElementById('leftHandStatus'),
            leftHandGesture: document.getElementById('leftHandGesture'),

            // 右手手势
            rightHandIcon: document.getElementById('rightHandIcon'),
            rightHandSymbol: document.getElementById('rightHandSymbol'),
            rightHandStatus: document.getElementById('rightHandStatus'),
            rightHandGesture: document.getElementById('rightHandGesture'),
            handOpenness: document.getElementById('handOpenness'),

            // 加载界面
            loadingScreen: document.getElementById('loadingScreen'),
            loadingText: document.getElementById('loadingText')
        };

        // 模式名称映射
        this.modeNames = {
            1: '地表植被',
            2: '地质岩浆',
            3: '人口热力',
            4: '全球夜景'
        };

        // FPS计算
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();

        // 启动时间更新
        this.startTimeUpdate();
    }

    /**
     * 更新系统状态
     */
    updateSystemStatus(status) {
        if (status.camera !== undefined) {
            this.elements.cameraStatus.textContent = status.camera ? '在线' : '离线';
            this.elements.cameraStatus.style.color = status.camera ? '#00ff00' : '#ff0000';
        }

        if (status.tracking !== undefined) {
            this.elements.trackingStatus.textContent = status.tracking ? '激活' : '未激活';
            this.elements.trackingStatus.style.color = status.tracking ? '#00ff00' : '#ffaa00';
        }
    }

    /**
     * 更新FPS显示
     */
    updateFPS() {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastFpsUpdate;

        if (elapsed >= 1000) {
            const fps = Math.round((this.frameCount / elapsed) * 1000);
            this.elements.fpsCounter.textContent = fps;
            this.elements.fpsCounter.style.color = fps >= 50 ? '#00ff00' : fps >= 30 ? '#ffaa00' : '#ff0000';

            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    /**
     * 更新时间戳
     */
    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            this.elements.timestamp.textContent = `${hours}:${minutes}:${seconds}`;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    /**
     * 更新地球状态
     */
    updateEarthStatus(mode, zoomPercent) {
        if (mode !== undefined) {
            this.elements.earthMode.textContent = this.modeNames[mode] || '未知';

            // 更新模式指示器
            document.querySelectorAll('.mode-item').forEach(item => {
                const itemMode = parseInt(item.dataset.mode);
                if (itemMode === mode) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        if (zoomPercent !== undefined) {
            this.elements.zoomLevel.textContent = `${zoomPercent}%`;
        }
    }

    /**
     * 更新左手手势状态
     */
    updateLeftHand(detected, number) {
        this.elements.leftHandStatus.textContent = detected ? '已检测' : '未检测';
        this.elements.leftHandStatus.style.color = detected ? '#00ff00' : '#666666';

        if (detected && number > 0) {
            this.elements.leftHandNumber.textContent = number;
            this.elements.leftHandGesture.textContent = `数字 ${number}`;
            this.elements.leftHandIcon.style.borderColor = '#ffd700';
            this.elements.leftHandIcon.style.boxShadow = '0 0 20px #ffd700';
        } else {
            this.elements.leftHandNumber.textContent = '-';
            this.elements.leftHandGesture.textContent = '无';
            this.elements.leftHandIcon.style.borderColor = '#00ffff';
            this.elements.leftHandIcon.style.boxShadow = '0 0 10px #00ffff';
        }
    }

    /**
     * 更新右手手势状态 (现在显示数字，与左手配对)
     */
    updateRightHand(detected, gesture, openness) {
        this.elements.rightHandStatus.textContent = detected ? '已检测' : '未检测';
        this.elements.rightHandStatus.style.color = detected ? '#00ff00' : '#666666';

        if (detected) {
            // 如果gesture是数字，显示它；否则显示张开状态
            const isNumber = typeof gesture === 'number' || (typeof gesture === 'string' && !isNaN(parseInt(gesture)));
            const numValue = isNumber ? parseInt(gesture) : 0;

            if (numValue > 0 && numValue <= 5) {
                this.elements.rightHandSymbol.textContent = numValue;
                this.elements.rightHandGesture.textContent = `数字 ${numValue}`;
            } else {
                this.elements.rightHandSymbol.textContent = '✋';
                this.elements.rightHandGesture.textContent = gesture === 'open' || gesture === 'pose' ? '张开' : '握紧';
            }
            this.elements.handOpenness.textContent = `${Math.round(openness * 100)}%`;

            // 根据手势改变颜色
            const color = numValue > 0 ? '#ffd700' : '#00ffff';
            this.elements.rightHandIcon.style.borderColor = color;
            this.elements.rightHandIcon.style.boxShadow = `0 0 20px ${color}`;
        } else {
            this.elements.rightHandSymbol.textContent = '✋';
            this.elements.rightHandGesture.textContent = '无';
            this.elements.handOpenness.textContent = '0%';
            this.elements.rightHandIcon.style.borderColor = '#00ffff';
            this.elements.rightHandIcon.style.boxShadow = '0 0 10px #00ffff';
        }
    }

    /**
     * 更新加载界面
     */
    updateLoading(text) {
        this.elements.loadingText.textContent = text;
    }

    /**
     * 隐藏加载界面
     */
    hideLoading() {
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
        }, 500);
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 创建错误提示元素
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px 50px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 2000;
            text-align: center;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        // 3秒后自动移除
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * 显示提示消息
     */
    showNotification(message, duration = 2000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 255, 0.2);
            border: 2px solid #00ffff;
            color: #00ffff;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 1500;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            animation: slideDown 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
