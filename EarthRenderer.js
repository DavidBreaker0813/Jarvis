/**
 * EarthRenderer.js
 * 3D地球渲染模块 - 使用Three.js渲染可交互的3D地球
 */

class EarthRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.atmosphere = null;
        this.currentMode = 1;
        this.targetScale = 1;
        this.currentScale = 1;
        this.currentScale = 1;
        this.rotationSpeed = 0.001;

        this.MIN_SCALE = 0.6; // 最小缩放 (握拳)
        this.MAX_SCALE = 2.8; // 最大缩放 (张开)

        this.init();
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5; // 拉远相机，让地球看起来更小 (User Request)

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // 创建光照
        this.setupLights();

        // 创建宇宙背景 (User Request)
        this.createUniverseBackground();

        // 创建地球
        this.createEarth();

        // 创建大气层
        this.createAtmosphere();

        // 开始渲染循环
        this.animate();

        // 响应窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createUniverseBackground() {
        // 1. 增强版星空背景 (High Density Starfield)
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 15000; // 增加星星数量
        const posArray = new Float32Array(starsCount * 3);
        const colorArray = new Float32Array(starsCount * 3);
        const sizeArray = new Float32Array(starsCount);

        for (let i = 0; i < starsCount * 3; i += 3) {
            // 随机分布在深空
            const r = 100 + Math.random() * 300;
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            posArray[i] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i + 2] = r * Math.cos(phi);

            // 颜色更丰富 (蓝、白、红、黄)
            const starType = Math.random();
            let color = new THREE.Color();
            if (starType > 0.95) color.setHex(0xaaaaaa); // 白
            else if (starType > 0.8) color.setHex(0x9db4ff); // 蓝白
            else if (starType > 0.6) color.setHex(0xffbd6f); // 橙黄
            else color.setHex(0x555555); // 暗淡背景星

            colorArray[i] = color.r;
            colorArray[i + 1] = color.g;
            colorArray[i + 2] = color.b;

            // 大小随机
            sizeArray[i / 3] = Math.random() * 0.5 + 0.1;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

        // 自定义着色器材质（让星星闪烁）
        const starsMaterial = new THREE.PointsMaterial({
            size: 0.2, // Base size
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            map: this.createStarTexture(),
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);

        // 2. 星云/银河带 (Nebula Effect) - 使用粒子云模拟
        this.createNebula();

        // 3. 太阳系背景 (Sun)
        this.createDistantSun();
    }

    createNebula() {
        const particleCount = 2000;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const color1 = new THREE.Color(0x4b0082); // 靛青
        const color2 = new THREE.Color(0x00ffff); // 青色

        for (let i = 0; i < particleCount; i++) {
            // 环状分布
            const radius = 150 + Math.random() * 50;
            const angle = Math.random() * Math.PI * 2;
            const spread = (Math.random() - 0.5) * 40; // 宽度

            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * 20; // 扁平
            const z = Math.sin(angle) * radius + spread;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const mixedColor = color1.clone().lerp(color2, Math.random());
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 4,
            vertexColors: true,
            transparent: true,
            opacity: 0.2,
            map: this.createStarTexture(), // 复用圆形纹理
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const nebula = new THREE.Points(geom, mat);
        // 让星云稍微倾斜
        nebula.rotation.x = Math.PI / 6;
        nebula.rotation.z = Math.PI / 8;
        this.scene.add(nebula);
    }

    createAtmosphere() {
        // 创建大气层发光光晕
        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
            }
        `;

        const geometry = new THREE.SphereGeometry(1.5 * 1.05, 128, 128); // 稍大一点
        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });

        this.atmosphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.atmosphere);
    }

    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    createDistantSun() {
        // 远处的太阳光晕
        const textureLoader = new THREE.TextureLoader();
        // 使用一个简单的发光球体模拟
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.6
        });
        const sun = new THREE.Mesh(geometry, material);
        sun.position.set(50, 20, -60); // 放在左后方远处
        this.scene.add(sun);

        // 太阳光晕 (Sprite)
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, 'rgba(255, 200, 100, 1)');
        grd.addColorStop(0.5, 'rgba(255, 100, 0, 0.3)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 128, 128);
        const spriteMat = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            color: 0xffaa00,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        const sunGlow = new THREE.Sprite(spriteMat);
        sunGlow.scale.set(40, 40, 1);
        sunGlow.position.copy(sun.position);
        this.scene.add(sunGlow);
    }

    setupLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);

        // 点光源（模拟太阳）
        const pointLight = new THREE.PointLight(0xffffff, 2, 100);
        pointLight.position.set(10, 5, 10);
        this.scene.add(pointLight);

        // 另一侧的补光
        const fillLight = new THREE.PointLight(0x0080ff, 0.5, 100);
        fillLight.position.set(-10, -5, -10);
        this.scene.add(fillLight);
    }

    createEarth() {
        const particleCount = 40000; // 粒子数量
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];

        // 使用纹理加载器获取颜色数据
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg',
            (texture) => {
                // 创建临时的canvas来读取像素数据
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 1024; // 降采样以提高性能读取
                canvas.height = 512;
                ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // 生成粒子
                // 使用斐波那契球面分布以获得均匀的球面点
                const phi = Math.PI * (3.0 - Math.sqrt(5.0)); // 黄金角

                for (let i = 0; i < particleCount; i++) {
                    const y = 1 - (i / (particleCount - 1)) * 2; // y 从 1 到 -1
                    const radiusAtY = Math.sqrt(1 - y * y); // 半径 at y

                    const theta = phi * i; // 黄金角增量

                    const x = Math.cos(theta) * radiusAtY;
                    const z = Math.sin(theta) * radiusAtY;

                    // 放大半径到 1.5
                    const r = 1.5;
                    positions.push(x * r, y * r, z * r);

                    // 映射到UV坐标读取颜色
                    // u = 0.5 + Math.atan2(z, x) / (2 * Math.PI)
                    // v = 0.5 - Math.asin(y) / Math.PI
                    const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
                    const v = 0.5 - Math.asin(y) / Math.PI;

                    // 读取像素颜色
                    const px = Math.floor(u * canvas.width);
                    const py = Math.floor(v * canvas.height);
                    const index = (py * canvas.width + px) * 4;

                    const red = imgData.data[index] / 255;
                    const green = imgData.data[index + 1] / 255;
                    const blue = imgData.data[index + 2] / 255;

                    colors.push(red, green, blue);

                    // 大小略作随机变动，模拟数据流感
                    sizes.push(Math.random() * 0.02 + 0.015);
                }

                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

                // 移除旧的earthMesh如果存在
                if (this.earth) this.scene.remove(this.earth);

                // 创建粒子材质
                const material = new THREE.PointsMaterial({
                    size: 0.02,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9,
                    sizeAttenuation: true,
                    blending: THREE.AdditiveBlending // 增加科幻感
                });

                this.earth = new THREE.Points(geometry, material);
                this.scene.add(this.earth);

                // 重新添加大气层 (如果被清除了，或者确保它在scene里)
                if (!this.atmosphere) this.createAtmosphere();
            },
            undefined,
            (err) => console.error("Error loading Earth texture for particles:", err)
        );
    }

    createFallbackTexture() {
        // 创建更逼真的程序化地球纹理（如果外部纹理加载失败）
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // 绘制深蓝色海洋背景
        const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        oceanGradient.addColorStop(0, '#0a1929');
        oceanGradient.addColorStop(0.5, '#0d47a1');
        oceanGradient.addColorStop(1, '#0a1929');
        ctx.fillStyle = oceanGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加海洋纹理细节
        ctx.fillStyle = 'rgba(30, 136, 229, 0.3)';
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3;
            ctx.fillRect(x, y, size, size);
        }

        // 绘制大陆（更真实的形状和颜色）
        const continents = [
            // 非洲
            { x: 0.52, y: 0.5, width: 0.12, height: 0.25, rotation: 0 },
            // 欧洲
            { x: 0.5, y: 0.35, width: 0.08, height: 0.12, rotation: 0 },
            // 亚洲
            { x: 0.65, y: 0.35, width: 0.2, height: 0.25, rotation: 0 },
            // 北美
            { x: 0.15, y: 0.3, width: 0.15, height: 0.25, rotation: 0 },
            // 南美
            { x: 0.22, y: 0.6, width: 0.1, height: 0.22, rotation: -15 },
            // 澳大利亚
            { x: 0.78, y: 0.7, width: 0.08, height: 0.1, rotation: 0 },
        ];

        continents.forEach((continent, index) => {
            const centerX = continent.x * canvas.width;
            const centerY = continent.y * canvas.height;
            const w = continent.width * canvas.width;
            const h = continent.height * canvas.height;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(continent.rotation * Math.PI / 180);

            // 使用渐变色绘制陆地
            const landGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) / 2);
            landGradient.addColorStop(0, '#4a7c59');
            landGradient.addColorStop(0.5, '#2e7d32');
            landGradient.addColorStop(0.7, '#1b5e20');
            landGradient.addColorStop(1, '#795548');

            ctx.fillStyle = landGradient;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#000000';

            // 绘制不规则大陆形状
            ctx.beginPath();
            const points = 20;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const radiusX = (w / 2) * (0.7 + Math.random() * 0.3);
                const radiusY = (h / 2) * (0.7 + Math.random() * 0.3);
                const px = Math.cos(angle) * radiusX;
                const py = Math.sin(angle) * radiusY;

                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.fill();

            // 添加地形细节
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // 山脉
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * Math.min(w, h) / 3;
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                const size = 5 + Math.random() * 15;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });

        // 添加极地冰盖
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';

        // 北极
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, 50, canvas.width * 0.2, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        // 南极
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height - 50, canvas.width * 0.25, 45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // 更新材质
        this.earthMaterial.map = texture;
        this.earthMaterial.needsUpdate = true;
    }

    createAtmosphere() {
        // 大气层效果 - 匹配更大的地球尺寸
        const atmosphereGeometry = new THREE.SphereGeometry(1.65, 64, 64); // 匹配1.5的地球
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });

        this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }

    /**
     * Update particle colors from a loaded texture
     */
    updateParticleColorsFromTexture(texture) {
        if (!this.earth || !this.earth.geometry) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 512;

        // Draw texture to canvas
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Get existing positions
        const positions = this.earth.geometry.attributes.position.array;
        const colors = [];

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Convert 3D position to UV coordinates
            const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
            const v = 0.5 - Math.asin(y / 1.5) / Math.PI;

            // Sample pixel color
            const px = Math.floor(u * canvas.width);
            const py = Math.floor(v * canvas.height);
            const index = (py * canvas.width + px) * 4;

            const red = imgData.data[index] / 255;
            const green = imgData.data[index + 1] / 255;
            const blue = imgData.data[index + 2] / 255;

            colors.push(red, green, blue);
        }

        // Update colors
        this.earth.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.earth.geometry.attributes.color.needsUpdate = true;
    }

    /**
     * 设置地球显示模式
     * Mode 1: 地表植被 (Vegetation) - 真实地球纹理
     * Mode 2: 地质岩浆 (Magma) - 动态程序化岩浆纹理
     * Mode 3: 人口热力图 (Population) - 数据可视化热力图
     * Mode 4: 全球夜景 (Night View) - 城市灯光夜景
     */
    setMode(mode) {
        this.currentMode = mode;
        console.log(`Switching to Marvel Mode ${mode}`);

        // 清除之前的程序化纹理canvas（节省内存）
        this.disposeOldTextures();

        // 确保地球显示并重置状态
        this.earth.visible = true;
        this.earth.material.wireframe = false;
        this.earth.material.opacity = 1.0;
        this.earth.material.transparent = false;

        // 移除之前的粒子系统（如果是从旧模式切过来）
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles = null;
        }
        if (this.energyField) {
            this.scene.remove(this.energyField);
            this.energyField = null;
        }
        if (this.clouds) {
            this.scene.remove(this.clouds);
            this.clouds = null;
        }

        switch (mode) {
            case 1: // 地表植被 (Real Earth - Blue Marble)
                const textureLoader1 = new THREE.TextureLoader();
                textureLoader1.load(
                    'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
                    (texture) => {
                        if (!this.earth) return;
                        this.updateParticleColorsFromTexture(texture);
                        console.log('Mode 1: Blue Marble texture loaded');
                    }
                );
                if (this.atmosphere) {
                    this.atmosphere.visible = true;
                }
                break;

            case 2: // 地质地形 (Topography)
                const textureLoader2 = new THREE.TextureLoader();
                textureLoader2.load(
                    'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
                    (texture) => {
                        if (!this.earth) return;
                        this.updateParticleColorsFromTexture(texture);
                        console.log('Mode 2: Topology texture loaded');
                    }
                );
                if (this.atmosphere) {
                    this.atmosphere.visible = true;
                }
                break;

            case 3: // 水体分布 (Water)
                const textureLoader3 = new THREE.TextureLoader();
                textureLoader3.load(
                    'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
                    (texture) => {
                        if (!this.earth) return;
                        this.updateParticleColorsFromTexture(texture);
                        console.log('Mode 3: Water texture loaded');
                    }
                );
                if (this.atmosphere) {
                    this.atmosphere.visible = true;
                }
                break;

            case 4: // 全球夜景 (Night Lights)
                const textureLoader4 = new THREE.TextureLoader();
                textureLoader4.load(
                    'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
                    (texture) => {
                        if (!this.earth) return;
                        this.updateParticleColorsFromTexture(texture);
                        console.log('Mode 4: Night lights texture loaded');
                    }
                );
                if (this.atmosphere) {
                    this.atmosphere.visible = false; // Hide atmosphere for night mode
                }
                break;
        }
    }

    resetToRealTexture() {
        // 重新加载或恢复真实纹理
        // 注意：实际项目中应该缓存texture对象避免重复加载，这里为演示简化
        if (this.realTextureCache) {
            this.earth.material.map = this.realTextureCache.map;
            this.earth.material.normalMap = this.realTextureCache.normalMap;
            this.earth.material.specularMap = this.realTextureCache.specularMap;
        }

        this.earth.material.emissive = new THREE.Color(0x000000);
        this.earth.material.emissiveIntensity = 0;
        this.earth.material.needsUpdate = true;
    }

    disposeOldTextures() {
        if (this.earth.material.map && this.earth.material.map.dispose) {
            // this.earth.material.map.dispose(); // 注意：不要销毁真实纹理缓存
        }
    }

    createMagmaTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 黑色底
        ctx.fillStyle = '#1a0500';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制熔岩流
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const r = Math.random() * 40 + 10;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)'); // 核心黄
            gradient.addColorStop(0.4, 'rgba(255, 50, 0, 0.6)'); // 中层橙红
            gradient.addColorStop(1, 'rgba(100, 0, 0, 0)'); // 边缘暗红

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // 绘制裂缝线条
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            for (let j = 0; j < 10; j++) {
                ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            }
            ctx.stroke();
        }

        return new THREE.CanvasTexture(canvas);
    }

    createHeatmapTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 深蓝科技底色
        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制热力点 (模拟人口分布，主要在大陆区域)
        // 简单模拟：随机分布，但在中心区域更密集
        for (let i = 0; i < 2000; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;

            // 简单的人口聚集逻辑：倾向于赤道和北半球中纬度
            const lat = (y / canvas.height) * 180 - 90;
            if (Math.abs(lat) > 60) continue; // 极地无人

            const intensity = Math.random();
            const color = intensity > 0.8 ? '#ff0000' : (intensity > 0.5 ? '#ffff00' : '#00ff00');
            const size = Math.random() * 4 + 1;

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // 绘制网格线增强科技感
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    createNightTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 纯黑底色
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 城市灯光 (金色点阵)
        ctx.fillStyle = '#ffaa00'; // 金色灯光
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;

            // 排除海洋大概区域 (简单模拟)
            // 实际应使用纹理遮罩，这里用随机模拟
            if (Math.random() > 0.3) {
                const size = Math.random() * 1.5 + 0.5;
                const alpha = Math.random() * 0.8 + 0.2;

                // 城市光晕
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                ctx.fill();

                // 核心光源
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * 创建云层效果（Mode 1使用）
     */
    createClouds() {
        const cloudGeometry = new THREE.SphereGeometry(1.52, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            map: this.createCloudTexture(),
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        this.scene.add(this.clouds);
    }

    /**
     * 创建云层纹理
     */
    createCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 20 + Math.random() * 60;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }



    // 移除旧的辅助方法（不再需要）
    createDataParticles() { }
    createHolographicScan() { }
    createEnergyField() { }

    /**
     * 设置缩放（基于右手手势）
     */
    setScale(openness) {
        // openness: 0 (握紧) 到 1 (张开)
        // 使用限制值进行映射
        // Clamp openness to 0-1 just in case
        const val = Math.max(0, Math.min(1, openness));

        // 线性插值
        this.targetScale = this.MIN_SCALE + val * (this.MAX_SCALE - this.MIN_SCALE);

        // console.log(`Scale: ${this.targetScale.toFixed(2)} (Openness: ${val.toFixed(2)})`);
    }

    /**
     * 动画循环
     */
    animate() {
        if (!this.renderer || !this.scene || !this.camera) return;

        requestAnimationFrame(() => this.animate());

        // 平滑缩放动画
        this.currentScale += (this.targetScale - this.currentScale) * 0.1;

        if (this.earth) {
            this.earth.scale.set(this.currentScale, this.currentScale, this.currentScale);
            this.earth.rotation.y += this.rotationSpeed;
        }

        if (this.atmosphere) {
            this.atmosphere.scale.set(this.currentScale, this.currentScale, this.currentScale);
            // 大气层旋转稍微慢一点/不同步，增加真实感
            this.atmosphere.rotation.y += this.rotationSpeed * 0.95;
        }

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 窗口大小变化处理
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * 获取当前缩放百分比
     */
    getZoomPercent() {
        return Math.round(this.currentScale * 100);
    }
}
