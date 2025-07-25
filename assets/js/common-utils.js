// assets/js/common-utils.js

// [성능 개선] SplineApplication과 THREE는 각 app 파일(main-app.js, sub-app.js)에서
// 필요할 때 동적으로 import하여 사용하므로, 여기서는 정적 import를 제거합니다.
// 대신, 이 라이브러리들을 사용하는 함수(loadSplineScene, InteractiveBackgroundSphere)가
// 파라미터로 해당 라이브러리 객체를 받도록 수정합니다.

import { ScrollTrigger } from "https://esm.sh/gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "https://esm.sh/gsap/ScrambleTextPlugin";

// [수정] THREE.js 모듈은 이 파일에서 직접 내보내지 않습니다.
// 각 app 파일(main-app, sub-app)이 필요에 따라 동적으로 직접 import합니다.
// 이로써 의존성 관리가 명확해지고, 'THREE' 객체가 undefined가 되는 문제를 해결합니다.

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
}

export function setupScrollRestoration() {
    window.scrollTo(0, 0);
    history.scrollRestoration = "manual";
    window.addEventListener("beforeunload", () => {
        window.scrollTo(0, 0);
    });
}
export function buildUrl(path) {
    if (typeof path !== 'string') return '';
    return path.startsWith('/') ? path.substring(1) : path;
}
export function degToRad(degrees) { return degrees * (Math.PI / 180); }
export function responsiveScale(percentage, currentBaselineWidth = 1920) { return (percentage / 100) * (window.innerWidth / currentBaselineWidth); }
export function responsiveX(percent) { const baselineWidth = 1920; return (percent / 100) * window.innerWidth; }
export function responsiveY(percent) { const baselineHeight = 1080; return (percent / 100) * window.innerHeight; }


// [FIX] sessionStorage 접근 시 발생할 수 있는 오류를 방지하기 위한 헬퍼 함수
function safeSessionGet(key) {
    try {
        return sessionStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function safeSessionSet(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch (e) {
        // 세션 스토리지에 쓸 수 없을 때의 경고는 제거합니다.
    }
}

export function runLoaderSequence(mainContentSelector = '#main-content') {
    return new Promise((resolve) => {
        const loader = document.getElementById('loader');
        const socket = document.getElementById('loader-socket');
        const socketPath = document.getElementById('lan-hole-path');
        const cableAssembly = document.getElementById('loader-cable-assembly');
        const cableHead = document.getElementById('loader-cable-head');
        const cableLine = document.getElementById('loader-cable-line');
        const cableHeadPath = cableHead ? cableHead.querySelector('.fill-path') : null;
        const loaderText = document.getElementById('loader-text');
        const mainContent = document.querySelector(mainContentSelector);

        if (!loader || !socket || !socketPath || !cableAssembly || !cableHead || !cableLine || !cableHeadPath || !loaderText) {
            console.error("Loader elements missing. Aborting loader sequence.");
            if (loader) gsap.set(loader, { autoAlpha: 0, display: 'none' });
            if (mainContent) gsap.set(mainContent, { autoAlpha: 1 });
            document.body.style.overflow = 'auto';
            resolve();
            return;
        }
        
        const completeAndShowContent = () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = 'auto';

            window.scrollTo(0, 0); 
            gsap.to(loader, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    loader.style.display = 'none'; 
                    
                    if (mainContent) {
                        gsap.to(mainContent, { 
                            opacity: 1, 
                            visibility: 'visible', 
                            duration: 0.5,
                            onComplete: () => {
                                if (typeof ScrollTrigger !== 'undefined') {
                                    ScrollTrigger.refresh();
                                }
                            }
                        });
                    }
                    resolve();
                }
            });
        };

        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';

        gsap.set(loader, { opacity: 1, visibility: 'visible', display: 'flex' });
        if (mainContent) {
             gsap.set(mainContent, { opacity: 0, visibility: 'hidden' });
        }

        const visitedKey = `visited_${window.location.pathname}`;
        const hasVisited = safeSessionGet(visitedKey);
        
        const socketRect = socket.getBoundingClientRect();
        const yOffset = 6; 
        const finalCableTop = socketRect.top + yOffset;

        if (hasVisited) {
            gsap.set(socketPath, { strokeDashoffset: 0, fill: '#ffc400', stroke: '#ffc400' });
            gsap.set(cableLine, { backgroundColor: '#ffc400' });
            gsap.set(cableHeadPath, { fill: '#ffc400' });
            gsap.set(cableAssembly, { top: finalCableTop, opacity: 1, scale: 1 });
            gsap.set(socket, { opacity: 1, scale: 1 });
            gsap.set(loaderText, { opacity: 1 });

            const tl = gsap.timeline({ onComplete: completeAndShowContent });
            tl.to([socket, cableAssembly, loaderText], {
                delay: 0.2,
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                ease: "power1.in",
                stagger: 0.05
            });

        } else {
            const socketPathLength = socketPath.getTotalLength();
            gsap.set(socketPath, {
                strokeDasharray: socketPathLength,
                strokeDashoffset: socketPathLength,
                fill: 'none',
                stroke: '#9d9d9d'
            });
            gsap.set(loaderText, { opacity: 0 });
            gsap.set([socket, cableAssembly], { scale: 1, opacity: 1 });
            gsap.set(cableAssembly, { top: '100vh' });

            const tl = gsap.timeline({
                onComplete: () => {
                    safeSessionSet(visitedKey, 'true');
                    completeAndShowContent();
                }
            });

            tl.to(socketPath, {
                strokeDashoffset: 0,
                duration: 1.5,
                ease: "power1.inOut"
            })
            .to(cableAssembly, {
                top: finalCableTop,
                duration: 2,
                ease: "power2.out" 
            }, "-=1.0")
            .to(socketPath, {
                fill: "#ffc400",
                stroke: "#ffc400",
                duration: 0.3
            }, "-=0.1")
            .to(cableLine, {
                backgroundColor: "#ffc400",
                duration: 0.3
            }, "<")
            .to(cableHeadPath, {
                fill: "#ffc400",
                duration: 0.3
            }, "<")
            .to(loaderText, {
                opacity: 1,
                duration: 0.5
            }, ">-0.2")
            .to([socket, cableAssembly, loaderText], {
                delay: 0.5,
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                ease: "power1.in",
                stagger: 0.05
            });
        }
    });
}

export function hideLoaderOnError() {
    const loader = document.getElementById('loader');
    if (loader) {
        gsap.to(loader, {
            duration: 0.3,
            opacity: 0,
            onComplete: () => {
                loader.style.display = 'none';
                document.documentElement.style.height = '';
                document.documentElement.style.overflow = '';
                document.body.style.height = '';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

export async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            const element = document.getElementById(elementId);
            if(element) element.innerHTML = `<p style="color:red; text-align:center; padding:1rem;">Error loading: ${filePath.split('/').pop()}</p>`;
            return null;
        }
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
            return element;
        } else {
            return null;
        }
    } catch (error) {
        const element = document.getElementById(elementId);
        if(element) element.innerHTML = `<p style="color:red; text-align:center; padding:1rem;">Error loading content: ${error.message}</p>`;
        return null;
    }
}

export async function loadCommonUI() {
    const baseCommonPath = 'assets/common/'; 

    try {
        await Promise.all([
            loadHTML('header-placeholder', `${baseCommonPath}_header.html`),
            loadHTML('menu-overlay-placeholder', `${baseCommonPath}_menu_overlay.html`),
            loadHTML('footer-placeholder', `${baseCommonPath}_footer.html`),
            loadHTML('loader-placeholder', `${baseCommonPath}_loader.html`)
        ]);

        if (typeof setupMenu === 'function') {
            setupMenu("menu-toggle", "menu-overlay", "menu-close", ".menu-links .top-link a");
        }

        if (typeof setupMenuLinkEffects === 'function') {
            setupMenuLinkEffects();
        }
        
        activateCurrentNavLink();

    } catch (error) {
        // 공통 UI 로딩 오류는 무시합니다.
    }
}

function activateCurrentNavLink() {
    const menuOverlayElement = document.getElementById('menu-overlay');
    if (!menuOverlayElement) return;
    const navLinks = menuOverlayElement.querySelectorAll('.menu-links .top-link a');
    if (navLinks.length === 0) return;
    let activeLink = null;
    const currentPath = window.location.pathname;
    const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
    navLinks.forEach(link => {
        const linkUrl = new URL(link.href, window.location.origin);
        const linkPath = linkUrl.pathname;
        const normalizedLinkPath = linkPath.replace(/\/$/, '') || '/';
        const isCurrentIndex = normalizedCurrentPath === '/' || normalizedCurrentPath === '/index.html';
        const isLinkIndex = normalizedLinkPath === '/' || normalizedLinkPath === '/index.html';
        if ((isCurrentIndex && isLinkIndex) || (!isCurrentIndex && !isLinkIndex && normalizedCurrentPath === normalizedLinkPath)) {
            activeLink = link;
        }
    });
    if (activeLink) {
        activeLink.classList.add('active-nav-link');
    }
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (activeLink) {
                activeLink.classList.remove('active-nav-link');
            }
        });
        link.addEventListener('mouseleave', () => {
            if (activeLink) {
                activeLink.classList.add('active-nav-link');
            }
        });
    });
}

// [성능 개선] InteractiveBackgroundSphere 클래스가 THREE.js 객체를 생성자에서 주입받도록 수정
export class InteractiveBackgroundSphere {
    constructor(containerSelector, THREE, config = {}) {
        this.container = document.getElementById(containerSelector);
        if (!this.container) {
            this.valid = false;
            return;
        }
        
        // [수정] 생성자에서 주입받은 THREE 객체를 사용합니다.
        // 이 THREE 객체는 undefined가 아니어야 합니다.
        if (!THREE || typeof THREE.Color === 'undefined') {
            console.error("InteractiveBackgroundSphere: THREE.js object is invalid or not provided.");
            this.valid = false;
            return;
        }
        this.THREE = THREE; 
        this.valid = true;

        this.config = {
            cameraZ: 2.99,
            sphereRadius: 2.5,
            sphereDetail: 6,
            wireframeColor: new this.THREE.Color(0xffffff),
            pointsColor: new this.THREE.Color(0xffffff),
            wireframeOpacity: 0.07, 
            pointsOpacity: 0.05,  
            pointsSize: 0.035,
            sphereOffsetX: 0,
            sphereOffsetY: 0,
            depthEffect: true,
            depthOpacityMinZ: 2.5,
            depthOpacityMaxZ: 4.0,
            minAlphaFactorForDepth: 0.35,
            mouseMoveSensitivity: 0.0025,
            mouseScaleSensitivity: 0.2,
            rotationSmoothness: 0.6,
            scaleSmoothness: 0.8,
            ...config
        };

        this.scene = null; this.camera = null; this.renderer = null;
        this.sphereGroup = null; this.wireframeMesh = null; this.pointsMesh = null;
        this.mouse = { x: 0, y: 0 };
        this.windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.targetProps = { rotationX: 0, rotationY: 0, scale: 1 };

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onResize = this._onResize.bind(this);
        this._animate = this._animate.bind(this);
    }

    init() {
        if (!this.valid || !this.container) return this;
        this.scene = new this.THREE.Scene();
        this.camera = new this.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = this.config.cameraZ;
        this.renderer = new this.THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);
        this.sphereGroup = new this.THREE.Group();
        this.scene.add(this.sphereGroup);
        this.sphereGroup.position.set(this.config.sphereOffsetX, this.config.sphereOffsetY, 0);
        this._createSphereGeometry();
        document.addEventListener('mousemove', this._onMouseMove, false);
        window.addEventListener('resize', this._onResize, false);
        this._animate();
        return this;
    }

    _createSphereGeometry() {
        if (!this.valid) return;
        if (this.wireframeMesh) this.sphereGroup.remove(this.wireframeMesh);
        if (this.pointsMesh) this.sphereGroup.remove(this.pointsMesh);

        const geometry = new this.THREE.IcosahedronGeometry(this.config.sphereRadius, this.config.sphereDetail);
        const wireframeMaterial = new this.THREE.MeshBasicMaterial({
            color: this.config.wireframeColor.clone(), wireframe: true, transparent: true, opacity: this.config.wireframeOpacity
        });
        const pointsMaterial = new this.THREE.PointsMaterial({
            color: this.config.pointsColor.clone(), size: this.config.pointsSize, sizeAttenuation: true, transparent: true, opacity: this.config.pointsOpacity,
        });

        if (this.config.depthEffect) {
            const setupDepthShader = (shader) => {
                shader.uniforms.uMinDepth = { value: this.config.depthOpacityMinZ };
                shader.uniforms.uMaxDepth = { value: this.config.depthOpacityMaxZ };
                shader.uniforms.uMinAlphaFactor = { value: this.config.minAlphaFactorForDepth };
                shader.vertexShader = `varying float vViewZDepth_custom;\n` + shader.vertexShader;
                shader.vertexShader = shader.vertexShader.replace('void main() {', `void main() {\nvec4 mvPosition_custom = modelViewMatrix * vec4(position, 1.0);\nvViewZDepth_custom = -mvPosition_custom.z;`);
                shader.fragmentShader = `varying float vViewZDepth_custom;\nuniform float uMinDepth;\nuniform float uMaxDepth;\nuniform float uMinAlphaFactor;\n` + shader.fragmentShader;
                shader.fragmentShader = shader.fragmentShader.replace(/}\s*$/, `\nfloat depthFactor_custom = smoothstep(uMaxDepth, uMinDepth, vViewZDepth_custom);\ndepthFactor_custom = max(depthFactor_custom, uMinAlphaFactor);\ngl_FragColor.a *= depthFactor_custom;\n}`);
            };
            wireframeMaterial.onBeforeCompile = setupDepthShader;
            pointsMaterial.onBeforeCompile = setupDepthShader;
        }

        const originalOnBeforeCompile = pointsMaterial.onBeforeCompile;
        pointsMaterial.onBeforeCompile = (shader) => {
            if (originalOnBeforeCompile) {
                originalOnBeforeCompile(shader);
            }
            const doubleCircleChunk = `
    float dist = length(gl_PointCoord - vec2(0.5, 0.5));
    if (dist > 0.5) {
        discard;
    }
    if (dist > 0.25) {
        gl_FragColor.a *= 0.4;
    }
`;
            shader.fragmentShader = shader.fragmentShader.replace(
                /}\s*$/,
                doubleCircleChunk + '\n}'
            );
        };

        this.wireframeMesh = new this.THREE.Mesh(geometry, wireframeMaterial); this.sphereGroup.add(this.wireframeMesh);
        this.pointsMesh = new this.THREE.Points(geometry, pointsMaterial); this.sphereGroup.add(this.pointsMesh);
    }

    _onMouseMove(event) {
        if (!this.valid) return;
        this.mouse.x = (event.clientX - this.windowHalf.x); this.mouse.y = (event.clientY - this.windowHalf.y);
        this.targetProps.rotationY = (this.mouse.x * this.config.mouseMoveSensitivity);
        this.targetProps.rotationX = (this.mouse.y * this.config.mouseMoveSensitivity);
        const scaleRange = this.config.mouseScaleSensitivity;
        let dynamicScale = 1 - (this.mouse.y / this.windowHalf.y) * scaleRange * 0.5;
        this.targetProps.scale = Math.max(1 - scaleRange, Math.min(1 + scaleRange, dynamicScale));
    }

    _animate() {
        if (!this.valid || !this.renderer || !this.scene || !this.camera || !this.sphereGroup || typeof gsap === 'undefined') return;
        requestAnimationFrame(this._animate);
        gsap.to(this.sphereGroup.rotation, { duration: this.config.rotationSmoothness, x: this.targetProps.rotationX, y: this.targetProps.rotationY, ease: "power1.out" });
        gsap.to(this.sphereGroup.scale, { duration: this.config.scaleSmoothness, x: this.targetProps.scale, y: this.targetProps.scale, z: this.targetProps.scale, ease: "power2.out" });
        this.renderer.render(this.scene, this.camera);
    }

    _onResize() {
        if (!this.valid || !this.camera || !this.renderer) return;
        this.windowHalf.x = window.innerWidth / 2; this.windowHalf.y = window.innerHeight / 2;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    introAnimate(scaleParams = { from: 1.5, to: 1, duration: 2.0, ease: "power2.out", delay: 0 }, rotationParams = { fromY: Math.PI, toY: 0, duration: 2.5, ease: "power2.out", delay: 0 }) {
        if (!this.valid || !this.sphereGroup || typeof gsap === 'undefined' || typeof this.THREE === 'undefined') return this;
        this.sphereGroup.scale.set(scaleParams.from, scaleParams.from, scaleParams.from);
        this.sphereGroup.rotation.y = rotationParams.fromY;
        const tl = gsap.timeline({ delay: Math.max(scaleParams.delay, rotationParams.delay) });
        tl.to(this.sphereGroup.scale, { x: scaleParams.to, y: scaleParams.to, z: scaleParams.to, duration: scaleParams.duration, ease: scaleParams.ease }, 0)
          .to(this.sphereGroup.rotation, { y: rotationParams.toY, duration: rotationParams.duration, ease: rotationParams.ease }, 0);
        this.targetProps.scale = scaleParams.to; this.targetProps.rotationX = 0; this.targetProps.rotationY = rotationParams.toY;
        return this;
    }

    updateColors(newColors) {
        if (!this.valid || typeof gsap === 'undefined' || typeof this.THREE === 'undefined') return this;
        if (this.wireframeMesh && newColors.wireframeColor) gsap.to(this.wireframeMesh.material.color, { r: newColors.wireframeColor.r, g: newColors.wireframeColor.g, b: newColors.wireframeColor.b, duration: 0.5 });
        if (this.pointsMesh && newColors.pointsColor) gsap.to(this.pointsMesh.material.color, { r: newColors.pointsColor.r, g: newColors.pointsColor.g, b: newColors.pointsColor.b, duration: 0.5 });
        if (newColors.wireframeColor) this.config.wireframeColor = newColors.wireframeColor.clone();
        if (newColors.pointsColor) this.config.pointsColor = newColors.pointsColor.clone();
        return this;
    }
    updateOpacities(opacities = {}, duration = 0.5) {
        if (!this.valid || typeof gsap === 'undefined') return this;
        if (this.wireframeMesh && typeof opacities.wireframeOpacity === 'number') {
            const newWireframeOpacity = Math.max(0, Math.min(1, opacities.wireframeOpacity)); this.config.wireframeOpacity = newWireframeOpacity;
            gsap.to(this.wireframeMesh.material, { opacity: newWireframeOpacity, duration: duration, ease: "power1.out" });
        }
        if (this.pointsMesh && typeof opacities.pointsOpacity === 'number') {
            const newPointsOpacity = Math.max(0, Math.min(1, opacities.pointsOpacity)); this.config.pointsOpacity = newPointsOpacity;
            gsap.to(this.pointsMesh.material, { opacity: newPointsOpacity, duration: duration, ease: "power1.out" });
        }
        return this;
    }
    setVisibility(isVisible, duration = 0.5) {
        if (!this.valid || !this.container || typeof gsap === 'undefined') return;
        gsap.to(this.container, { autoAlpha: isVisible ? 1 : 0, duration: duration, ease: "power1.out" });
    }
}


export function setupMenu(toggleId, overlayId, closeId, linksSelector) {
    const menuToggle = document.getElementById(toggleId);
    const menuOverlay = document.getElementById(overlayId);
    const menuClose = document.getElementById(closeId);
    
    if (!menuToggle || !menuOverlay || !menuClose || typeof gsap === 'undefined') {
        return;
    }

    const menuLinkElements = menuOverlay.querySelectorAll(linksSelector);
    const menuInfo = menuOverlay.querySelector('.menu-info');

    const numPanels = 6;
    let panelWrapper = menuOverlay.querySelector('.menu-blind-panels-wrapper');
    if (!panelWrapper) {
        panelWrapper = document.createElement('div');
        panelWrapper.className = 'menu-blind-panels-wrapper';
        for (let i = 0; i < numPanels; i++) {
            const panel = document.createElement('div');
            panel.className = 'menu-blind-panel';
            panelWrapper.appendChild(panel);
        }
        menuOverlay.insertBefore(panelWrapper, menuOverlay.firstChild);
    }
    const blindPanels = Array.from(panelWrapper.children);

    const initialY = 30;
    gsap.set(blindPanels, { yPercent: -100 });
    gsap.set(menuLinkElements, { opacity: 0, y: initialY });
    if (menuInfo) {
      gsap.set(menuInfo, { opacity: 0, y: initialY });
    }

    const openMenu = () => {
        if (menuOverlay.classList.contains("hidden")) {
            menuOverlay.classList.remove("hidden");
        }
        document.body.style.overflow = "hidden";
        if(menuToggle) menuToggle.style.display = "none"; 

        gsap.set(menuOverlay, { autoAlpha: 1 }); 
        
        const openTl = gsap.timeline();
        openTl.to(blindPanels, { 
            duration: 0.4, 
            yPercent: 0, 
            ease: "power2.out", 
            stagger: 0.07 
        });

        openTl.to(menuLinkElements, { 
            duration: 0.7, 
            opacity: 1, 
            y: 0, 
            ease: "power3.out", 
            stagger: { each: 0.1 }
        }, "-=0.2"); 

        if (menuInfo) {
            openTl.to(menuInfo, {
                duration: 0.6,
                opacity: 1,
                y: 0,
                ease: "power2.out"
            }, "-=0.5");
        }
    };

    const closeMenu = () => {
        const closeTl = gsap.timeline({
            onComplete: () => {
                gsap.set(menuOverlay, { autoAlpha: 0 }); 
                menuOverlay.classList.add("hidden");
                if (menuToggle) menuToggle.style.display = "block"; 
                document.body.style.overflow = "auto";
                
                gsap.set(menuLinkElements, { opacity: 0, y: initialY });
                if(menuInfo) gsap.set(menuInfo, { opacity: 0, y: initialY });
            }
        });

        closeTl.to([menuLinkElements, menuInfo], { 
            duration: 0.4, 
            opacity: 0, 
            y: initialY,
            ease: "power3.in", 
            stagger: { 
                each: 0.07, 
                from: "end",
            }
        });
        
        closeTl.to(blindPanels, { 
            duration: 0.4, 
            yPercent: 100,
            ease: "power2.in", 
            stagger: { each: 0.07, from: "end" } 
        }, "-=0.2");
    };

    menuToggle.addEventListener("click", openMenu);
    menuClose.addEventListener("click", closeMenu);
}


export function setupMenuLinkEffects() {
    const menuOverlayElement = document.getElementById('menu-overlay');
    if (!menuOverlayElement) return;
    const menuAnchorElements = menuOverlayElement.querySelectorAll(".menu-links .top-link a");
    if (menuAnchorElements.length === 0 || typeof gsap === 'undefined' || !gsap.plugins.scrambleText) return;
    const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let currentActiveSVG = null; 
    const allSvgData = Array.from(menuAnchorElements).map((anchor, i) => {
        const svgElement = anchor.querySelector(".menu-link-hover-svg");
        const svgPath = svgElement ? svgElement.querySelector(".arrow-path") : null;
        const textSpanElement = anchor.querySelector(".menu-link-text");
        let originalText = textSpanElement ? textSpanElement.innerText.trim() : `[NoTextFound${i}]`;
        let measuredWidth = 0;
        if (textSpanElement) {
            const parentA = textSpanElement.parentElement; 
            const clone = textSpanElement.cloneNode(true);
            if (parentA) {
                const parentStyles = window.getComputedStyle(parentA);
                clone.style.fontFamily = parentStyles.fontFamily;
                clone.style.fontSize = parentStyles.fontSize;
                clone.style.fontWeight = parentStyles.fontWeight;
                clone.style.letterSpacing = parentStyles.letterSpacing;
            }
            clone.style.visibility = 'hidden';
            clone.style.position = 'absolute';
            clone.style.whiteSpace = 'nowrap';
            clone.style.left = '-9999px';
            document.body.appendChild(clone);
            measuredWidth = clone.offsetWidth;
            document.body.removeChild(clone);
        }
        return { anchor, svgElement, svgPath, textSpanElement, initialized: false, pathLength: 0, originalWidth: measuredWidth > 0 ? measuredWidth + 4 : 0, originalText: originalText };
    });
    allSvgData.forEach(data => {
        if (data.svgElement) gsap.set(data.svgElement, { opacity: 0, x: -10 });
        if (data.textSpanElement && data.originalWidth > 0) gsap.set(data.textSpanElement, { minWidth: data.originalWidth + 'px' }); 
    });
    allSvgData.forEach((data, index) => {
        const { anchor, svgElement, svgPath, textSpanElement, originalText } = data; 
        if (!textSpanElement && !svgPath) return;
        const initializeCurrentSvgPath = () => {
            if (svgPath && !data.initialized) {
                try {
                    const length = svgPath.getTotalLength();
                    gsap.set(svgPath, { strokeDasharray: length, strokeDashoffset: length });
                    data.pathLength = length; data.initialized = true; return true;
                } catch (e) { return false; }
            }
            return data.initialized;
        };
        const hideOtherSVGs = (currentAnchor) => {
            allSvgData.forEach(otherData => {
                if (otherData.anchor !== currentAnchor && otherData.svgElement) {
                    gsap.killTweensOf(otherData.svgElement); 
                    gsap.killTweensOf(otherData.svgPath);   
                    gsap.set(otherData.svgElement, { opacity: 0, x: -10 });
                    if (otherData.svgPath && otherData.initialized && otherData.pathLength > 0) {
                        gsap.set(otherData.svgPath, { strokeDashoffset: otherData.pathLength });
                    }
                }
            });
        };
        const animateCurrentSvgIn = () => {
            if (svgPath && data.initialized) {
                 if (isNaN(data.pathLength) || (data.pathLength === 0 && svgPath.getBBox && svgPath.getBBox().width > 0)) {
                    gsap.killTweensOf(svgElement); gsap.set(svgElement, { opacity: 1, x: 0 }); return;
                 }
                 if (isNaN(data.pathLength)) return;
                hideOtherSVGs(anchor); 
                currentActiveSVG = svgElement; 
                gsap.killTweensOf(svgElement); gsap.killTweensOf(svgPath);
                gsap.set(svgElement, { opacity: 0, x: -10 });
                gsap.to(svgElement, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
                gsap.fromTo(svgPath, { strokeDashoffset: data.pathLength }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
            } else if (svgPath && initializeCurrentSvgPath()) {
                animateCurrentSvgIn();
            }
        };
        const animateCurrentSvgOut = () => {
            if (svgPath && data.initialized) {
                if (isNaN(data.pathLength)) return;
                gsap.killTweensOf(svgElement); gsap.killTweensOf(svgPath);
                gsap.to(svgElement, { opacity: 0, x: -10, duration: 0.2, ease: "power1.in", onComplete: () => {
                    if (currentActiveSVG === svgElement) { 
                        currentActiveSVG = null;
                    }
                }});
                if (data.pathLength > 0) gsap.to(svgPath, { strokeDashoffset: data.pathLength, duration: 0.2, ease: "power1.in" });
            } else if (svgElement) {
                gsap.set(svgElement, { opacity: 0, x: -10 });
                 if (currentActiveSVG === svgElement) {
                    currentActiveSVG = null;
                }
            }
        };
        anchor.addEventListener('pointerenter', () => {
            allSvgData.forEach(otherData => {
                if (otherData.anchor !== anchor && otherData.textSpanElement && gsap.isTweening(otherData.textSpanElement)) {
                    gsap.killTweensOf(otherData.textSpanElement);
                    otherData.textSpanElement.innerText = otherData.originalText; 
                }
            });
            hideOtherSVGs(anchor); 
            const svgReady = initializeCurrentSvgPath();
            if (textSpanElement && originalText && !gsap.isTweening(textSpanElement) && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
                gsap.to(textSpanElement, { 
                    duration: 0.8, 
                    ease: 'sine.in', 
                    scrambleText: { text: originalText, chars: scrambleChars, speed: 2, revealDelay: 0.1, tweenLength: false },
                    onComplete: () => { 
                        if (svgReady) animateCurrentSvgIn();
                    }
                });
            } else if (svgReady) {
                animateCurrentSvgIn();
            }
        });
        anchor.addEventListener('pointerleave', () => {
            if (textSpanElement && gsap.isTweening(textSpanElement)) {
                 gsap.killTweensOf(textSpanElement);
                 textSpanElement.innerText = originalText; 
            }
            animateCurrentSvgOut();
        });
        anchor.addEventListener('focus', () => anchor.dispatchEvent(new PointerEvent('pointerenter', {bubbles: true}))); 
        anchor.addEventListener('blur', () => anchor.dispatchEvent(new PointerEvent('pointerleave', {bubbles: true}))); 
    });
}

// [성능 개선] SplineApplication을 파라미터로 받아 의존성을 주입합니다.
export async function loadSplineScene(canvasId, sceneUrl, SplineApplication) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) { return null; }
    const app = new SplineApplication(canvas);
    try {
        await app.load(sceneUrl);
        return app;
    } catch (error) { return null; }
}

export function killAllScrollTriggers() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
}
export function killScrollTriggersByPattern(idPattern) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    let killedCount = 0;
    ScrollTrigger.getAll().forEach(st => {
        if (st.vars.id && st.vars.id.startsWith(idPattern)) { st.kill(); killedCount++; }
    });
}

// 모달(팝업) 관련 함수들 (기존과 동일)
async function openModal(url) {
    const modal = document.getElementById('modal-popup');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    if (!modal || !modalBody || !modalTitle) return;
    document.body.classList.add('modal-open');
    document.body.style.setProperty('padding', '0px', 'important');
    modalTitle.textContent = '로딩 중...';
    modalBody.innerHTML = '';
    modal.style.display = 'block';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const pageTitle = doc.querySelector('title')?.textContent || '팝업 내용';
        modalTitle.textContent = pageTitle;
        modalBody.innerHTML = '';
        const popupStyles = doc.head.querySelectorAll('style');
        popupStyles.forEach(style => modalBody.appendChild(style.cloneNode(true)));
        modalBody.innerHTML += doc.body.innerHTML;
    } catch (error) {
        modalTitle.textContent = '오류';
        modalBody.innerHTML = `<p style="text-align:center; padding:20px;">콘텐츠를 불러오는 데 실패했습니다: ${error.message}</p>`;
    }
}

function closeModal() {
    const modal = document.getElementById('modal-popup');
    if (modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding');
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        if (modalBody) modalBody.innerHTML = '';
        if (modalTitle) modalTitle.textContent = '';
    }
}

document.addEventListener('click', function(event) {
    const popupLink = event.target.closest('.popup-link');
    const closeButton = event.target.closest('.modal-close-btn');
    const modal = document.getElementById('modal-popup');
    if (popupLink) {
        event.preventDefault();
        const rawUrl = popupLink.getAttribute('data-popup-url');
        if (rawUrl) {
            const finalUrl = buildUrl(rawUrl);
            openModal(finalUrl);
        }
    } else if (closeButton || event.target === modal) {
        closeModal();
    }
});
