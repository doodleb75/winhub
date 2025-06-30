// assets/js/common-utils.js

// --- Spline Runtime Import ---
import { Application as SplineApplication } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

// --- [MODIFIED] Import and Export THREE.js from one central place ---
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
export { THREE }; // Export for other modules to use

// --- GSAP and Plugins ---
import { ScrollTrigger } from "https://esm.sh/gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "https://esm.sh/gsap/ScrambleTextPlugin";

if (typeof gsap === 'undefined') {
    console.error("COMMON-UTILS: GSAP core library is not loaded. Please include it in your HTML. Effects will not work.");
} else {
    gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
}

// --- Scroll Restoration ---
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
// --- Utility Functions ---
export function degToRad(degrees) { return degrees * (Math.PI / 180); }
export function responsiveScale(percentage, currentBaselineWidth = 1920) { return (percentage / 100) * (window.innerWidth / currentBaselineWidth); }
export function responsiveX(percent) { const baselineWidth = 1920; return (percent / 100) * window.innerWidth; }
export function responsiveY(percent) { const baselineHeight = 1080; return (percent / 100) * window.innerHeight; }


// [FIX] sessionStorage 접근 시 발생할 수 있는 오류를 방지하기 위한 헬퍼 함수
/**
 * Safely retrieves an item from sessionStorage.
 * @param {string} key The key to retrieve.
 * @returns {string|null} The value, or null if an error occurs or the key doesn't exist.
 */
function safeSessionGet(key) {
    try {
        return sessionStorage.getItem(key);
    } catch (e) {
        console.warn("Could not access sessionStorage. It might be disabled (e.g., in private Browse mode).", e);
        return null;
    }
}

/**
 * Safely sets an item in sessionStorage.
 * @param {string} key The key to set.
 * @param {string} value The value to store.
 */
function safeSessionSet(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch (e) {
        console.warn(`Could not write to sessionStorage. It might be disabled. (Key: ${key})`, e);
    }
}


/**
 * [MODIFIED] Executes the SVG loader animation sequence.
 * Checks sessionStorage to see if the page has been visited before in the current session.
 * If so, it plays a much shorter animation.
 * @param {string} mainContentSelector - Selector for the main content area to show after loading.
 * @returns {Promise<void>} A promise that resolves when the loader animation is complete.
 */
export function runLoaderSequence(mainContentSelector = '#main-content') {
    return new Promise((resolve) => {
        // Select loader elements
        const loader = document.getElementById('loader');
        const socket = document.getElementById('loader-socket');
        const socketPath = document.getElementById('lan-hole-path');
        const cable = document.getElementById('loader-cable');
        const loaderText = document.getElementById('loader-text');
        const mainContent = document.querySelector(mainContentSelector);

        if (!loader || !socket || !socketPath || !cable || !loaderText) {
            console.warn("Loader elements not found. Skipping animation.");
            if (loader) gsap.set(loader, { autoAlpha: 0 });
            if (mainContent) gsap.set(mainContent, { autoAlpha: 1 });
            document.body.style.overflow = 'auto';
            resolve();
            return;
        }
        
        // --- Shared Completion Logic ---
        const completeAndShowContent = () => {
            window.scrollTo(0, 0); 
            gsap.to(loader, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    loader.style.visibility = 'hidden';
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
                    document.body.style.overflow = 'auto';
                    resolve();
                }
            });
        };

        // --- Initial setup ---
        gsap.set(loader, { opacity: 1, visibility: 'visible' });
        document.body.style.overflow = 'hidden';
        if (mainContent) {
             gsap.set(mainContent, { opacity: 0, visibility: 'hidden' });
        }

        const visitedKey = `visited_${window.location.pathname}`;
        const hasVisited = safeSessionGet(visitedKey); // [FIX] Use safe getter
        
        const socketRect = socket.getBoundingClientRect();
        const yOffset = 6; 
        const finalCableTop = socketRect.top + yOffset;

        if (hasVisited) {
            // --- SKIP ANIMATION (Already Visited) ---
            gsap.set(socketPath, { strokeDashoffset: 0, fill: '#ffc400', stroke: '#ffc400' });
            gsap.set(cable, { top: finalCableTop, opacity: 1, scale: 1 });
            gsap.set(socket, { opacity: 1, scale: 1 });
            gsap.set(loaderText, { opacity: 1 });

            const tl = gsap.timeline({ onComplete: completeAndShowContent });
            tl.to([socket, cable, loaderText], {
                delay: 0.2,
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                ease: "power1.in",
                stagger: 0.05
            });

        } else {
            // --- FULL ANIMATION (First Visit) ---
            const socketPathLength = socketPath.getTotalLength();
            gsap.set(socketPath, {
                strokeDasharray: socketPathLength,
                strokeDashoffset: socketPathLength,
                fill: 'none',
                stroke: '#9d9d9d'
            });
            gsap.set(loaderText, { opacity: 0 });
            gsap.set([socket, cable], { scale: 1, opacity: 1 });
            gsap.set(cable, { top: '100vh' });

            const tl = gsap.timeline({
                onComplete: () => {
                    safeSessionSet(visitedKey, 'true'); // [FIX] Use safe setter
                    completeAndShowContent();
                }
            });

            // Original animation sequence
            tl.to(socketPath, {
                strokeDashoffset: 0,
                duration: 1.5,
                ease: "power1.inOut"
            })
            .to(cable, {
                top: finalCableTop,
                duration: 2,
                ease: "power2.out" 
            }, "-=1.0")
            .to(socketPath, {
                fill: "#ffc400",
                stroke: "#ffc400",
                duration: 0.3
            }, "-=0.1")
            .to(loaderText, {
                opacity: 1,
                duration: 0.5
            }, ">-0.2")
            .to([socket, cable, loaderText], {
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

/**
 * Hides the loader immediately in case of an error during initialization.
 */
export function hideLoaderOnError() {
    const loader = document.getElementById('loader');
    if (loader) {
        gsap.to(loader, {
            duration: 0.3,
            opacity: 0,
            onComplete: () => {
                loader.style.visibility = 'hidden';
                document.body.style.overflow = 'auto';
            }
        });
    }
}


// --- HTML Fragment Loader ---
export async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.error(`Failed to load HTML from ${filePath}: ${response.status} ${response.statusText}`);
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
            console.warn(`Element with ID '${elementId}' not found for ${filePath}.`);
            return null;
        }
    } catch (error) {
        console.error(`Error loading HTML from ${filePath}:`, error);
        const element = document.getElementById(elementId);
        if(element) element.innerHTML = `<p style="color:red; text-align:center; padding:1rem;">Error loading content: ${error.message}</p>`;
        return null;
    }
}

// --- Common UI Loader and Script Initializer ---
export async function loadCommonUI() {
    const baseCommonPath = 'assets/common/'; 

    try {
        await Promise.all([
            loadHTML('header-placeholder', `${baseCommonPath}header.html`),
            loadHTML('menu-overlay-placeholder', `${baseCommonPath}menu_overlay.html`),
            loadHTML('footer-placeholder', `${baseCommonPath}footer.html`),
            loadHTML('loader-placeholder', `${baseCommonPath}loader.html`)
        ]);

        if (typeof setupMenu === 'function') {
            setupMenu("menu-toggle", "menu-overlay", "menu-close", ".menu-links .top-link a");
        } else {
            console.warn('setupMenu function is not defined or not accessible after loading common UI.');
        }

        if (typeof setupMenuLinkEffects === 'function') {
            setupMenuLinkEffects();
        } else {
            console.warn('setupMenuLinkEffects function is not defined or not accessible after loading common UI.');
        }
        
        activateCurrentNavLink();

    } catch (error) {
        console.error("Error loading one or more common UI components:", error);
    }
}

/**
 * [MODIFIED FOR GITHUB PAGES] Sets the active state for the current navigation link.
 * This version correctly handles subdirectory hosting like GitHub Pages.
 */
function activateCurrentNavLink() {
    const menuOverlayElement = document.getElementById('menu-overlay');
    if (!menuOverlayElement) {
        console.warn("activateCurrentNavLink: Menu overlay element with ID 'menu-overlay' was not found.");
        return;
    }

    const navLinks = menuOverlayElement.querySelectorAll('.menu-links .top-link a');
    if (navLinks.length === 0) {
        console.warn("activateCurrentNavLink: No navigation links found under '.menu-links .top-link a'.");
        return;
    }

    let activeLink = null;
    // 현재 페이지의 전체 주소를 가져옵니다. (e.g., "https://user.github.io/repo/page/about.html")
    const currentPageHref = window.location.href.replace(/\/$/, ''); // 마지막 슬래시 제거

    // 가장 정확하게 일치하는 링크를 먼저 찾습니다.
    navLinks.forEach(link => {
        if (link.href.replace(/\/$/, '') === currentPageHref) {
            activeLink = link;
        }
    });

    // 만약 정확히 일치하는 링크가 없다면, 'index.html' 관련 예외 처리를 합니다.
    // (e.g. "..../winhub/" 와 "..../winhub/index.html" 을 동일하게 취급)
    if (!activeLink) {
        navLinks.forEach(link => {
            const linkHref = link.href.replace(/\/$/, '');
            if (
                (currentPageHref.endsWith('/index.html') && currentPageHref.replace('/index.html', '') === linkHref) ||
                (linkHref.endsWith('/index.html') && linkHref.replace('/index.html', '') === currentPageHref)
            ) {
                activeLink = link;
            }
        });
    }

    // --- 여기부터 아래 코드는 기존과 동일합니다 ---

    // --- Initial setup ---
    // Add the active class to the correct link when the page loads.
    if (activeLink) {
        activeLink.classList.add('active-nav-link');
    }

    // --- Add hover event listeners to all navigation links for the visual effect ---
    navLinks.forEach(link => {
        // When the mouse enters ANY link...
        link.addEventListener('mouseenter', () => {
            // ...temporarily hide the active state.
            if (activeLink) {
                activeLink.classList.remove('active-nav-link');
            }
        });

        // When the mouse leaves ANY link...
        link.addEventListener('mouseleave', () => {
            // ...restore the active state.
            if (activeLink) {
                activeLink.classList.add('active-nav-link');
            }
        });
    });
}


// InteractiveBackgroundSphere class (unchanged)
export class InteractiveBackgroundSphere {
    constructor(containerSelector, config = {}) {
        this.container = document.getElementById(containerSelector);
        if (!this.container) {
            console.error(`COMMON-UTILS: Three.js container '${containerSelector}' not found.`);
            this.valid = false;
            return;
        }
        
        // [MODIFIED] Use the imported THREE object directly
        this.THREE = THREE;
        this.valid = true;

        this.config = {
            cameraZ: 2.95,
            sphereRadius: 2.5,
            sphereDetail: 6,
            wireframeColor: new this.THREE.Color(0xffffff),
            pointsColor: new this.THREE.Color(0xffffff),
            wireframeOpacity: 0.1, 
            pointsOpacity: 0.05,  
            pointsSize: 0.035,
            sphereOffsetX: 0,
            sphereOffsetY: 0,
            depthEffect: true,
            depthOpacityMinZ: 2.5,
            depthOpacityMaxZ: 4.0,
            minAlphaFactorForDepth: 0.25,
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
    
    if (!menuToggle || !menuOverlay || !menuClose) {
        console.warn("Menu elements not found, setup aborted.");
        return;
    }
    if (typeof gsap === 'undefined') {
        console.error("GSAP is not loaded for setupMenu.");
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

    // Set initial states for animations
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

        // Animate menu-info in last, as requested
        if (menuInfo) {
            openTl.to(menuInfo, {
                duration: 0.6,
                opacity: 1,
                y: 0,
                ease: "power2.out"
            }, "-=0.5"); // Overlap with link animation for a smooth effect
        }
    };

    const closeMenu = () => {
        const closeTl = gsap.timeline({
            onComplete: () => {
                gsap.set(menuOverlay, { autoAlpha: 0 }); 
                menuOverlay.classList.add("hidden");
                if (menuToggle) menuToggle.style.display = "block"; 
                document.body.style.overflow = "auto";
                
                // Reset states for next open
                gsap.set(menuLinkElements, { opacity: 0, y: initialY });
                if(menuInfo) gsap.set(menuInfo, { opacity: 0, y: initialY });
            }
        });

        // Animate elements out
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
            yPercent: 100, // Close downwards
            ease: "power2.in", 
            stagger: { each: 0.07, from: "end" } 
        }, "-=0.2");
    };

    menuToggle.addEventListener("click", openMenu);
    menuClose.addEventListener("click", closeMenu);
}


export function setupMenuLinkEffects() {
    const menuOverlayElement = document.getElementById('menu-overlay');
    if (!menuOverlayElement) {
        console.warn("COMMON-UTILS: Menu overlay not found for link effects setup. Effects will not be applied.");
        return;
    }
    const menuAnchorElements = menuOverlayElement.querySelectorAll(".menu-links .top-link a");

    if (menuAnchorElements.length === 0) {
        console.warn("COMMON-UTILS: Menu anchor elements (.menu-links .top-link a) for effects not found.");
        return;
    }
    if (typeof gsap === 'undefined' || !gsap.plugins.scrambleText) {
        console.error("COMMON-UTILS: GSAP core or ScrambleTextPlugin is not properly registered. Scramble effect will not work.");
        return;
    }

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
        
        return { 
            anchor, 
            svgElement, 
            svgPath, 
            textSpanElement, 
            initialized: false, 
            pathLength: 0, 
            originalWidth: measuredWidth > 0 ? measuredWidth + 4 : 0, 
            originalText: originalText
        };
    });

    allSvgData.forEach(data => {
        if (data.svgElement) {
            gsap.set(data.svgElement, { opacity: 0, x: -10 });
        }
        if (data.textSpanElement && data.originalWidth > 0) {
            gsap.set(data.textSpanElement, { minWidth: data.originalWidth + 'px' }); 
        }
    });


    allSvgData.forEach((data, index) => {
        const { anchor, svgElement, svgPath, textSpanElement, originalText } = data; 

        if (!textSpanElement && !svgPath) {
            return;
        }

        const initializeCurrentSvgPath = () => {
            if (svgPath && !data.initialized) {
                try {
                    const length = svgPath.getTotalLength();
                    gsap.set(svgPath, { strokeDasharray: length, strokeDashoffset: length });
                    data.pathLength = length; data.initialized = true; return true;
                } catch (e) { console.error(`COMMON-UTILS: [Link ${index}] Error initializing SVG path for "${originalText}":`, e); return false; }
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

export async function loadSplineScene(canvasId, sceneUrl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) { console.error(`COMMON-UTILS: Spline canvas with ID '${canvasId}' not found.`); return null; }
    const app = new SplineApplication(canvas);
    try {
        await app.load(sceneUrl);
        return app;
    } catch (error) { console.error(`COMMON-UTILS: Failed to load Spline scene from ${sceneUrl}:`, error); return null; }
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