/**
 * app.js
 * 主应用协调器 - 整合所有模块并管理应用流程
 */

// 全局变量
let gestureDetector = null;
let earthRenderer = null;
let jarvisUI = null;

// 应用初始化
async function initApp() {
    console.log('JARVIS System Initializing...');

    // 创建UI控制器
    jarvisUI = new JarvisUI();
    jarvisUI.updateLoading('正在初始化UI系统...');

    // 等待DOM完全加载
    await new Promise(resolve => setTimeout(resolve, 500));

    // 创建3D地球渲染器
    jarvisUI.updateLoading('正在创建3D地球...');
    try {
        earthRenderer = new EarthRenderer('earthContainer');
        console.log('Earth renderer initialized');
    } catch (error) {
        console.error('Failed to initialize Earth renderer:', error);
        jarvisUI.showError('3D渲染初始化失败');
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // 创建手势检测器
    jarvisUI.updateLoading('正在启动摄像头...');
    const videoElement = document.getElementById('videoElement');
    const canvasElement = document.getElementById('handCanvas');

    try {
        gestureDetector = new HandGestureDetector(videoElement, canvasElement);
        console.log('Gesture detector created');
    } catch (error) {
        console.error('Failed to create gesture detector:', error);
        jarvisUI.showError('手势检测器创建失败');
        return;
    }

    // 设置手势回调
    setupGestureCallbacks();

    // 启动摄像头
    jarvisUI.updateLoading('正在访问摄像头...');
    try {
        await gestureDetector.startCamera();
        console.log('Camera started');
        jarvisUI.updateSystemStatus({ camera: true, tracking: true });
    } catch (error) {
        console.error('Failed to start camera:', error);
        jarvisUI.showError('摄像头启动失败，请允许摄像头权限');
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 隐藏加载界面
    jarvisUI.updateLoading('系统就绪！');
    jarvisUI.hideLoading();

    // 显示欢迎消息
    setTimeout(() => {
        jarvisUI.showNotification('🚀 JARVIS系统已启动', 3000);
    }, 1000);

    // 启动主循环
    startMainLoop();

    console.log('JARVIS System Ready');
}

/**
 * 设置手势回调函数
 */
function setupGestureCallbacks() {
    // 1. 双手手势同时识别 - 切换模式
    gestureDetector.onDualHandGesture = (number) => {
        console.log(`Dual Hand Gesture Matched: ${number}`);

        // 只有当数字在1-4之间时切换
        if (number >= 1 && number <= 4) {
            earthRenderer.setMode(number);
            jarvisUI.updateEarthStatus(number);
            jarvisUI.showNotification(`指令确认: 模式 ${number} 已激活`, 1500);
        }
    };

    // 2. 双手距离 - 控制缩放
    gestureDetector.onHandDistance = (normalizedDistance) => {
        // normalizedDistance: 0 (Min Zoom) -> 1 (Max Zoom)
        // console.log(`Hand Distance: ${normalizedDistance.toFixed(2)}`);
        earthRenderer.setScale(normalizedDistance);
    };

    // UI更新回调
    gestureDetector.onHandsDetected = (data) => {
        // 更新UI显示
        jarvisUI.updateLeftHand(data.leftHand, data.leftNumber);
        // 右手UI现在显示相同的手势数字或其他信息
        jarvisUI.updateRightHand(data.rightHand, data.rightGesture, 0);
    };

    // Removed old independent handlers
    gestureDetector.onLeftHandChange = null;
    gestureDetector.onRightHandChange = null;
}

/**
 * 主循环
 */
function startMainLoop() {
    function loop() {
        // 更新FPS
        jarvisUI.updateFPS();

        // 更新地球状态显示
        const zoomPercent = earthRenderer.getZoomPercent();
        jarvisUI.updateEarthStatus(undefined, zoomPercent);

        requestAnimationFrame(loop);
    }

    loop();
}

/**
 * 根据数字获取模式名称
 */
function getModeNameByNumber(number) {
    const names = {
        1: '标准视图',
        2: '线框模式',
        3: '点云模式',
        4: '全息投影'
    };
    return names[number] || '未知';
}

/**
 * 错误处理
 */
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    if (jarvisUI) {
        jarvisUI.showError('系统错误：' + event.error.message);
    }
});

/**
 * 窗口大小变化处理
 */
window.addEventListener('resize', () => {
    if (gestureDetector) {
        const canvas = document.getElementById('handCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

/**
 * 键盘快捷键（用于调试）
 */
document.addEventListener('keydown', (event) => {
    // 1-4键切换模式
    if (event.key >= '1' && event.key <= '4') {
        const mode = parseInt(event.key);
        earthRenderer.setMode(mode);
        jarvisUI.updateEarthStatus(mode);
        jarvisUI.showNotification(`键盘切换: ${getModeNameByNumber(mode)}`, 1500);
    }

    // +/- 键调整缩放
    if (event.key === '+' || event.key === '=') {
        earthRenderer.setScale(0); // 最大缩放（握紧）
    }
    if (event.key === '-' || event.key === '_') {
        earthRenderer.setScale(1); // 最小缩放（张开）
    }
});

// 页面加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
