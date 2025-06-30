// assets/js/sub-app.js

import { Application as SplineRuntimeApp } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';
import * as THREE_MOD from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
window.THREE = THREE_MOD; // Expose THREE to the global scope for common-utils.js

import { ScrollToPlugin } from "https://esm.sh/gsap/ScrollToPlugin";
import { SplitText } from "https://esm.sh/gsap/SplitText";

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin);
    if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
    else console.error("SUB-APP: SplitText not loaded, cannot register plugin.");
} else console.error("SUB-APP: GSAP core not loaded, cannot register plugins.");

import {
    setupScrollRestoration,
    degToRad,
    responsiveY, // responsiveY 임포트 추가
    startLoaderBarAnimation,
    hideLoader,
    InteractiveBackgroundSphere,
    loadSplineScene,
    killAllScrollTriggers,
    loadCommonUI
} from './common-utils.js';

// --- Subpage Specific Global Variables ---
let subpageSplineApp = null;
let subPageBackgroundSphere = null;
let subpageBodyElement = null;
let splitTitle = null;
let splitDescription = null;
let heroSection = null;
let splineIntroPlayed = false; // Flag to ensure Spline intro animation plays only once
let gnbHeight = 0; // GNB 높이를 저장할 변수
let isSnapping = false; // 스냅 애니메이션 중복 방지 플래그 (복원)
let isResizing = false; // 리사이즈 중인지 여부를 나타내는 플래그

// Spline 오브젝트의 원본 상태를 저장할 변수 추가
let originalWinhubState = null;

const HERO_AREA_BACKGROUND_COLOR = "#292c35";
const pageColorConfigs = {
    "default": { bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR, sphereColor: new THREE.Color(0xffffff), textColor: "#ffffff" },
    "about.html": { bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR, sphereColor: new THREE.Color(0xeaf2f8), textColor: "#fdfefe" },
    "works.html": { bodyBackgroundColorFallback: "#0e2059", sphereColor: new THREE.Color(0xaed6f1), textColor: "#ecf0f1" },
    "contact.html": { bodyBackgroundColorFallback: "#3f0e59", sphereColor: new THREE.Color(0xaed6f1), textColor: "#ecf0f1" },
};
// 배경색과 텍스트 색상 반전을 방지하기 위해 scrolledPastHeroColors에서 해당 속성을 제거
// 하지만, 컨텐츠 텍스트의 "반전 후 어두운 컬러"를 위해 targetColor를 지정
const scrolledPastHeroColors = { 
    sphereColor: new THREE.Color(0x999999),
    darkContentTextColor: "#2c3e50" // 컨텐츠 텍스트의 반전 후 어두운 색상 정의
}; 

function getResponsiveSplineProperties() {
    const isMobile = window.innerWidth <= 768;
    // 모바일일 경우, 크기는 1.8배로 키우고 y축 위치를 조정하여 중앙에 오도록 합니다.
    if (isMobile) {
        return {
            scaleMultiplier: 1.8,
            positionYOffset: -150 // y-offset to center the object vertically
        };
    }
    // 데스크탑 기본값
    return {
        scaleMultiplier: 1.0,
        positionYOffset: 0
    };
}

function getCurrentPageConfig() {
    const pathname = window.location.pathname.split('/').pop() || "default";
    return pageColorConfigs[pathname] || pageColorConfigs["default"];
}
const currentPageConfig = getCurrentPageConfig();

function initialPageVisualSetup(isResize = false) {
    if (typeof gsap === 'undefined') return;
    subpageBodyElement = document.querySelector('.subpage-body'); if (!subpageBodyElement) return;
    heroSection = document.getElementById("sub-hero");
    const gnbContainer = document.querySelector('.gnb-container');
    if (gnbContainer) {
        gnbHeight = gnbContainer.offsetHeight;
    }

    gsap.set("#sub-hero", { autoAlpha: 1 });
    gsap.set(".sub-hero-content", { autoAlpha: 0 });
    gsap.set([".sub-hero-content .page-title", ".sub-hero-content .page-description"], { autoAlpha: 0, y: 0, xPercent: 0 });
    gsap.set(".scroll-icon", { autoAlpha: 0 });

    const nonHeroSections = gsap.utils.toArray(".subpage-section:not(#sub-hero)");
    nonHeroSections.forEach(section => {
        const wrapper = section.querySelector(".section-content-wrapper");
        if (wrapper) {
            const animatedContent = wrapper.querySelector(".animated-content");
            if (animatedContent) gsap.set(animatedContent, { opacity: 0, y: 50 });
            else gsap.set(wrapper, {opacity: 0, y: 50});
        } else {
            gsap.set(section, {opacity:0, y:50});
        }
    });

    const splineContainer = document.getElementById("threejs-object-container");
    if (splineContainer && !isResize) {
        gsap.set(splineContainer, { autoAlpha: 0 });
    }

    // 바디 배경색은 항상 초기 설정 색상을 유지
    gsap.set(subpageBodyElement, { backgroundColor: currentPageConfig.bodyBackgroundColorFallback });
    subpageBodyElement.classList.remove('scrolled-past-hero-colors');

    const heroDependentElements = getHeroDependentElements();
    const heroTextElements = getHeroTextElements();
    const otherContentElements = getOtherContentTextElements();

    heroDependentElements.forEach(el => gsap.set(el, { color: currentPageConfig.textColor }));
    // Hero 텍스트 요소 (page-title, page-description)는 초기 색상을 유지
    heroTextElements.forEach(el => gsap.set(el, { color: currentPageConfig.textColor }));
    // 기타 콘텐츠 요소는 초기 색상을 유지 (나중에 switchColors에서 반전됨)
    otherContentElements.forEach(el => gsap.set(el, { color: currentPageConfig.textColor }));
}

function getHeroDependentElements() {
    return [
        ...document.querySelectorAll(".com-name-logo.logo-class"),
        ...document.querySelectorAll(".menu-icon")
    ];
}

function getHeroTextElements() {
    return heroSection ? [
        ...heroSection.querySelectorAll(".page-title.title-class"),
        ...heroSection.querySelectorAll(".page-description.content-class")
    ] : [];
}

function getOtherContentTextElements() {
    let elements = [];
    document.querySelectorAll(".subpage-section:not(#sub-hero)").forEach(section => {
        const wrapper = section.querySelector(".section-content-wrapper");
        if (wrapper) {
            elements.push(...wrapper.querySelectorAll('h2, h3, p, .tab-button, span.content-class, a.content-class, div.content-class, .biz-domain-item-icon'));
        }
        elements.push(...section.querySelectorAll('.content-class, h2, h3, p, .biz-domain-item-icon'));
    });
    elements.push(...document.querySelectorAll("footer.subpage-footer .content-class, footer.subpage-footer span, footer.subpage-footer a"));

    const heroDependent = getHeroDependentElements();
    const heroTexts = getHeroTextElements();

    return elements.filter((el, index, self) =>
        self.indexOf(el) === index &&
        !heroDependent.includes(el) &&
        !heroTexts.includes(el) &&
        el.closest('#sub-hero') === null &&
        (el.textContent.trim() !== "" || el.children.length > 0 || ['IMG', 'SVG', 'I'].includes(el.tagName))
    );
}

/**
 * Hero 영역을 벗어날 때 색상을 전환합니다.
 * @param {boolean} isScrolledPast - Hero 영역을 지나쳤는지 여부
 */
function switchColors(isScrolledPast) {
    const heroDependentElements = getHeroDependentElements(); // GNB 로고, 메뉴 아이콘
    const otherContentTextElements = getOtherContentTextElements(); // Hero 외부의 모든 텍스트

    const duration = 0.5;

    if (isScrolledPast) {
        subpageBodyElement.classList.add('scrolled-past-hero-colors');
    } else {
        subpageBodyElement.classList.remove('scrolled-past-hero-colors');
    }

    // Body 배경색은 반전되지 않고 원래 색상을 유지합니다.
    // 이전 요청에 따라 이 줄은 제거된 상태를 유지합니다.
    // REMOVED: gsap.to(subpageBodyElement, { backgroundColor: targetBodyBg, duration: duration, overwrite: "auto" });
    
    // 배경 구체 색상 애니메이션 (이전처럼 반전됩니다.)
    const targetSphereColors = isScrolledPast ? scrolledPastHeroColors.sphereColor : currentPageConfig.sphereColor;
    if (subPageBackgroundSphere) {
        subPageBackgroundSphere.updateColors({ 
            wireframeColor: targetSphereColors, 
            pointsColor: targetSphereColors 
        });
    }

    // GNB/메뉴 색상 변경 (로고와 메뉴 아이콘만 반전)
    const logoMenuColorScrolledPast = scrolledPastHeroColors.darkContentTextColor; // 어두운 색상 사용
    const logoMenuColorInHero = currentPageConfig.textColor; 
    heroDependentElements.forEach(el => gsap.to(el, { 
        color: isScrolledPast ? logoMenuColorScrolledPast : logoMenuColorInHero, 
        duration: duration, 
        overwrite: "auto" 
    }));

    // Hero 텍스트 (page-title, page-description) 색상은 반전되지 않고 원래 색상을 유지합니다.
    // 이전 요청에 따라 이 줄은 제거된 상태를 유지합니다.
    // REMOVED: heroTextElements.forEach(el => gsap.to(el, { color: targetTextColor, duration: duration, overwrite: "auto" }));

    // Hero 아래 섹션의 콘텐츠 텍스트 색상 (반전 후 어두운 색상으로 고정)
    // 스크롤 시 어두운 색상으로 반전되고, 스크롤 복귀 시 원래 밝은 색상으로 돌아옵니다.
    const contentTargetTextColor = isScrolledPast ? scrolledPastHeroColors.darkContentTextColor : currentPageConfig.textColor;
    otherContentTextElements.forEach(el => gsap.to(el, { 
        color: contentTargetTextColor, 
        duration: duration, 
        overwrite: "auto" 
    }));
}

/**
 * Hero 영역을 벗어날 때 색상 전환을 처리할 ScrollTrigger를 설정합니다.
 */
function setupHeroColorSwitcher() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !subpageBodyElement || !heroSection) return;

    const existingTrigger = ScrollTrigger.getById("heroColorSwitcher");
    if (existingTrigger) existingTrigger.kill();
    
    ScrollTrigger.create({
        id: "heroColorSwitcher",
        trigger: heroSection,
        start: "bottom 80%", // Hero 영역 하단이 뷰포트 80% 지점을 지날 때
        toggleActions: "play none none reverse",
        onEnter: () => switchColors(true),
        onLeaveBack: () => switchColors(false),
        invalidateOnRefresh: true,
    });
}

/**
 * Hero 영역 스크롤 시 패럴랙스 및 애니메이션 효과를 생성합니다.
 * Hero 섹션에 'pin' 기능을 제거하고, 패럴랙스 효과만 유지합니다.
 */
function setupHeroParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !heroSection) return;

    const subHeroContent = heroSection.querySelector(".sub-hero-content");
    const splineObjectContainer = document.getElementById("threejs-object-container");
    const backgroundContainer = document.getElementById('fullscreen-threejs-bg');

    // --- 1. Parallax ScrollTrigger (for yPercent and scale scrubbing) ---
    const existingParallaxTrigger = ScrollTrigger.getById("heroParallax");
    if (existingParallaxTrigger) existingParallaxTrigger.kill();

    const parallaxTl = gsap.timeline({
        scrollTrigger: {
            id: "heroParallax",
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
            // pin: true, // pin 기능 제거
            invalidateOnRefresh: true,
        }
    });

    // Animate yPercent and scale for parallax, but NOT autoAlpha
    if (subHeroContent) {
        parallaxTl.to(subHeroContent, { yPercent: -80, ease: "none" }, 0); // [수정] 이동거리 증가
    }
    if (splineObjectContainer) {
        parallaxTl.to(splineObjectContainer, { yPercent: -40, scale: 0.9, ease: "none" }, 0); // [수정] 이동거리 및 크기변화 증가
    }
    if (backgroundContainer) {
        parallaxTl.to(backgroundContainer, { yPercent: -20, ease: "none" }, 0); // [수정] 이동거리 증가
    }

    // --- 2. Visibility and Animation ScrollTrigger ---
    const existingVisibilityTrigger = ScrollTrigger.getById("heroVisibilityTrigger");
    if (existingVisibilityTrigger) existingVisibilityTrigger.kill();

    ScrollTrigger.create({
        id: "heroVisibilityTrigger",
        trigger: heroSection,
        start: "top top", // When the top of the hero hits the top of the viewport
        end: "bottom top", // When the bottom of the hero hits the top of the viewport
        invalidateOnRefresh: true,
        // When scrolling down and leaving the hero section
        onLeave: () => {
            gsap.to([subHeroContent, splineObjectContainer], { autoAlpha: 0, duration: 0.3 });
        },
        // When scrolling back up into the hero section
        onEnterBack: () => {
            gsap.to(splineObjectContainer, { autoAlpha: 1, duration: 0.3 });
            gsap.to(subHeroContent, {
                autoAlpha: 1,
                duration: 0.1, // Fade in container quickly
                onComplete: () => {
                    animateHeroText(); // Then play the detailed text animation
                }
            });
        },
    });
}


function setupSubPageContentAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const sections = gsap.utils.toArray(".subpage-section:not(#sub-hero)");

    sections.forEach((section, index) => {
        const contentWrapper = section.querySelector(".section-content-wrapper");
        let animatedElements = [];
        
        if (contentWrapper) {
            const specificAnimatedContent = contentWrapper.querySelector(".animated-content");
            if (specificAnimatedContent) {
                animatedElements = [specificAnimatedContent];
            } else {
                animatedElements = [contentWrapper];
            }
        } else {
            animatedElements = [section];
        }

        animatedElements.forEach(el => {
            const existingST = ScrollTrigger.getAll().find(st => st.vars.trigger === section && st.animation && st.animation.targets().includes(el));
            if (existingST) existingST.kill();

            gsap.set(el, { opacity: 0, y: 50 });

            ScrollTrigger.create({
                trigger: section,
                start: "top 80%",
                end: "bottom 20%",
                invalidateOnRefresh: true,
                onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", overwrite: "auto" }),
                onLeave: () => gsap.to(el, { opacity: 0, y: -50, duration: 0.4, ease: "power1.in", overwrite: "auto" }),
                onEnterBack: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }),
                onLeaveBack: () => gsap.to(el, { opacity: 0, y: 50, duration: 0.4, ease: "power1.in", overwrite: "auto" }),
            });
        });
    });
}


function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    if (tabButtons.length === 0 || tabContents.length === 0) return;

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            const targetTab = button.getAttribute("data-tab");
            const targetContent = document.getElementById(targetTab);
            if (targetContent) targetContent.classList.add("active");
        });
    });

    if (!document.querySelector(".tab-button.active") && tabButtons.length > 0) {
        tabButtons[0].classList.add("active");
        const firstTabId = tabButtons[0].getAttribute("data-tab");
        const firstTabContent = document.getElementById(firstTabId);
        if (firstTabContent) firstTabContent.classList.add("active");
    }
}

function animateHeroText() {
    const subHeroContent = document.querySelector(".sub-hero-content");
    if (!subHeroContent) {
        const emptyTl = gsap.timeline();
        emptyTl.eventCallback("onComplete", () => {});
        return emptyTl;
    }

    const pageTitle = subHeroContent.querySelector(".page-title");
    const pageDescription = subHeroContent.querySelector(".page-description");

    if (splitTitle && typeof splitTitle.revert === 'function') splitTitle.revert();
    if (splitDescription && typeof splitDescription.revert === 'function') splitDescription.revert();
    splitTitle = null;
    splitDescription = null;

    if (gsap.getProperty(subHeroContent, "autoAlpha") === 0) {
        gsap.set(subHeroContent, {autoAlpha: 1});
    }
    gsap.set([pageTitle, pageDescription], { autoAlpha: 0, y: 0, xPercent: 0, clearProps: "all" });

    const masterTextAnimationTl = gsap.timeline();

    if (pageTitle && pageTitle.offsetParent !== null) { 
        if (typeof SplitText !== 'undefined') {
            try {
                splitTitle = new SplitText(pageTitle, { type: "chars" }); 
                if (splitTitle.chars && splitTitle.chars.length > 0) {
                    masterTextAnimationTl.fromTo(splitTitle.chars, 
                        { autoAlpha: 0, y: -200 },
                        {
                            duration: .5, autoAlpha: 1, y: 0, ease: "back.out(1.7)", stagger: 0.1
                        }
                    );
                } else { 
                    masterTextAnimationTl.from(pageTitle, { duration: 0.7, autoAlpha: 0, y: -50, ease: "power2.out" });
                }
            } catch (e) { 
                console.warn("SUB-APP: SplitText error on page title, using simple animation.", e);
                masterTextAnimationTl.from(pageTitle, { duration: 0.7, autoAlpha: 0, y: -50, ease: "power2.out" });
            }
        } else { 
            masterTextAnimationTl.from(pageTitle, { duration: 0.7, autoAlpha: 0, y: -50, ease: "power2.out" });
        }
    }

    if (pageDescription && pageDescription.offsetParent !== null) { 
        if (typeof SplitText !== 'undefined') {
            try {
                splitDescription = new SplitText(pageDescription, { type: "lines" });
                if (splitDescription.lines && splitDescription.lines.length > 0) {
                    // MODIFICATION START: 애니메이션 시작 위치를 조정하여 순차적으로 재생되도록 합니다.
                    masterTextAnimationTl.from(splitDescription.lines, {
                        duration: 0.6, autoAlpha: 0, y: 50, ease: "back.out(1.7)", stagger: 0.1
                    }, ">"); // ">"는 타임라인의 끝에서 시작하라는 의미입니다.
                    // MODIFICATION END
                } else {
                    masterTextAnimationTl.from(pageDescription, { duration: 0.7, autoAlpha: 0, y: 30, ease: "power2.out" }, ">");
                }
            } catch (e) {
                console.warn("SUB-APP: SplitText error on page description, using simple animation.", e);
                masterTextAnimationTl.from(pageDescription, { duration: 0.7, autoAlpha: 0, y: 30, ease: "power2.out" }, ">");
            }
        } else {
            masterTextAnimationTl.from(pageDescription, { duration: 0.7, autoAlpha: 0, y: 30, ease: "power2.out" }, ">");
        }
    }
    return masterTextAnimationTl;
}

function setupScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (!scrollToTopBtn) return;

    window.addEventListener("scroll", () => {
        if (window.scrollY > window.innerHeight / 2) {
            if (!scrollToTopBtn.classList.contains("show")) scrollToTopBtn.classList.add("show");
        } else {
            if (scrollToTopBtn.classList.contains("show")) scrollToTopBtn.classList.remove("show");
        }
    });
    scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/**
 * [MODIFIED] Manages the scroll icon's visibility.
 * Hides the icon as soon as the page is scrolled down from the very top.
 */
function setupSubPageScrollIconAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const scrollIcon = document.querySelector("#sub-hero .scroll-icon");
    if (!scrollIcon) return;

    // It's hidden by initialPageVisualSetup, so we explicitly make it visible after a short delay
    // to ensure it appears after the main hero content has animated in.
    gsap.to(scrollIcon, { autoAlpha: 1, duration: 0.5, delay: 1.5 });

    const existingTrigger = ScrollTrigger.getById('subPageScrollIconVisibilityTrigger');
    if (existingTrigger) {
        existingTrigger.kill();
    }

    ScrollTrigger.create({
        id: 'subPageScrollIconVisibilityTrigger',
        trigger: document.body,
        start: 1, // Triggers 1px from the top
        end: 'max',
        invalidateOnRefresh: true,
        onEnter: () => gsap.to(scrollIcon, { autoAlpha: 0, duration: 0.2 }), // Hide on scroll down
        onLeaveBack: () => gsap.to(scrollIcon, { autoAlpha: 1, duration: 0.2 }), // Show when back at top
    });
}

/**
 * [MODIFIED] Add Scroll Snap from Hero to first Content Section and back using manual scrollTo.
 * 리사이즈 중에는 스냅을 방지합니다.
 */
function setupHeroScrollSnap() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof ScrollToPlugin === 'undefined') {
        console.error("GSAP, ScrollTrigger, or ScrollToPlugin not loaded for scroll snap.");
        return;
    }

    const heroSection = document.getElementById('sub-hero');
    const firstContentSection = document.querySelector('.subpage-section:not(#sub-hero)');

    if (!heroSection || !firstContentSection) {
        console.warn("Scroll Snap: Hero or first content section not found.");
        return;
    }
    
    const existingTrigger = ScrollTrigger.getById("heroScrollSnapTrigger");
    if (existingTrigger) existingTrigger.kill();

    ScrollTrigger.create({
        id: 'heroScrollSnapTrigger',
        trigger: heroSection,
        start: "top top-1", // Start 1px from the top
        end: "bottom top", // Fires when bottom of hero hits top of viewport
        
        onEnter: self => {
            // Snap down when scrolling past the start
            // isResizing 플래그를 확인하여 리사이즈 중에는 스냅을 방지합니다.
            if (isSnapping || self.direction !== 1 || isResizing) return; 
            
            isSnapping = true;
            
            gsap.to(window, {
                scrollTo: {
                    y: firstContentSection,
                },
                duration: .35,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.delayedCall(0.1, () => {
                        isSnapping = false;
                    });
                },
                overwrite: 'auto'
            });
        },
        
        onEnterBack: self => {
            // Snap up when scrolling back into the hero section
            // isResizing 플래그를 확인하여 리사이즈 중에는 스냅을 방지합니다.
            if (isSnapping || self.direction !== -1 || isResizing) return; 
            
            isSnapping = true;
            
            gsap.to(window, {
                scrollTo: {
                    y: 0 // Snap to the very top of the page
                },
                duration: .35,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.delayedCall(0.1, () => {
                        isSnapping = false;
                    });
                },
                overwrite: 'auto'
            });
        },
        invalidateOnRefresh: true
    });
}


async function initializeSubpage() {
    initialPageVisualSetup();
    const loaderBarPromise = startLoaderBarAnimation({ barDuration: 1.2 });
    const criticalLoadPromises = [];

    if (typeof THREE !== 'undefined' && subpageBodyElement) {
        subPageBackgroundSphere = new InteractiveBackgroundSphere('fullscreen-threejs-bg', {
            wireframeColor: currentPageConfig.sphereColor.clone(),
            pointsColor: currentPageConfig.sphereColor.clone(),
        });
        if (subPageBackgroundSphere.valid !== false && subPageBackgroundSphere.init) {
            subPageBackgroundSphere.init();
        }
    }

    const splineObjectContainer = document.getElementById("threejs-object-container");
    const splineCanvas = document.getElementById('spline-canvas-subpage');

    if (splineCanvas && splineObjectContainer) {
        const splineLoadPromise = loadSplineScene("spline-canvas-subpage", "https://prod.spline.design/0FDfaGjmdgz0JYwR/scene.splinecode")
            .then(app => {
                subpageSplineApp = app;
                if (subpageSplineApp) {
                    const cableObject = subpageSplineApp.findObjectByName('cable');
                    if (cableObject) {
                        cableObject.visible = false;
                    }
                }
                return app;
            })
            .catch(error => {
                console.error("SUB-APP: Error loading subpage Spline scene:", error);
                if (splineObjectContainer) gsap.set(splineObjectContainer, { display: 'none' });
                return null;
            });
        criticalLoadPromises.push(splineLoadPromise);
    } else if (splineObjectContainer) {
        gsap.set(splineObjectContainer, { display: 'none' });
    }
   
    try {
        await loaderBarPromise;
        if (criticalLoadPromises.length > 0) await Promise.all(criticalLoadPromises);
    }
    catch (error) { console.error("SUB-APP: Error during critical loading or loader bar:", error); }
   
    await hideLoader({ fadeDuration: 0.4 });

    const menuIconElement = document.querySelector(".menu-icon");
    if (menuIconElement) {
        gsap.to(menuIconElement, { duration: 0.8, autoAlpha: 1, ease: "power2.out", delay: 0.2 });
    }

    const subHeroContent = document.querySelector(".sub-hero-content");
    if (subHeroContent) {
        gsap.to(subHeroContent, { autoAlpha: 1, duration: 0.1, onComplete: () => {
            const heroTextAnim = animateHeroText(); 
            heroTextAnim.eventCallback("onComplete", () => {
                const winhubObject = subpageSplineApp ? subpageSplineApp.findObjectByName("Winhub") : null;

                if (splineObjectContainer && winhubObject && !splineIntroPlayed) {
                    splineIntroPlayed = true;
                    
                    // 원본 상태 저장 (최초 1회)
                    if (!originalWinhubState) {
                        originalWinhubState = {
                            scale: { ...winhubObject.scale },
                            position: { ...winhubObject.position }
                        };
                    }

                    // 화면 크기에 맞는 속성 가져오기
                    const responsiveProps = getResponsiveSplineProperties();

                    // 목표 상태 계산
                    const targetScale = {
                        x: originalWinhubState.scale.x * responsiveProps.scaleMultiplier,
                        y: originalWinhubState.scale.y * responsiveProps.scaleMultiplier,
                        z: originalWinhubState.scale.z * responsiveProps.scaleMultiplier
                    };
                    const targetRotation = { x: degToRad(0), y: degToRad(90), z: degToRad(0) };
                    const targetPosition = {
                        x: originalWinhubState.position.x,
                        y: originalWinhubState.position.y + responsiveProps.positionYOffset,
                        z: originalWinhubState.position.z
                    };

                    const splineIntroMasterTl = gsap.timeline();
                    const objectAnimOffset = 0.2;

                    splineIntroMasterTl
                        .to(splineObjectContainer, { autoAlpha: 1, duration: 1 }, 0)
                        .call(() => {
                            if (winhubObject) winhubObject.visible = true;
                        }, null, 0)
                        .fromTo(winhubObject.scale,
                            {
                                x: targetScale.x * 0.5,
                                y: targetScale.y * 0.5,
                                z: targetScale.z * 0.5
                            },
                            {
                                x: targetScale.x,
                                y: targetScale.y,
                                z: targetScale.z,
                                duration: 1.5,
                                ease: "power3.out"
                            }, objectAnimOffset)
                        .fromTo(winhubObject.rotation,
                            {
                                x: degToRad(90),
                                y: degToRad(-360), 
                                z: degToRad(5)
                            },
                            {
                                x: targetRotation.x,
                                y: targetRotation.y,
                                z: targetRotation.z,
                                duration: 1.5,
                                ease: "power3.out"
                            }, objectAnimOffset)
                        .fromTo(winhubObject.position,
                            { 
                                x: targetPosition.x - 200, // 시작 시 X 위치는 슬라이드 인 효과 유지
                                y: targetPosition.y, 
                                z: targetPosition.z 
                            },
                            {
                                x: targetPosition.x,
                                y: targetPosition.y,
                                z: targetPosition.z,
                                duration: 1.5,
                                ease: "power3.out"
                            }, objectAnimOffset);

                } else if (splineObjectContainer && splineIntroPlayed) {
                    gsap.set(splineObjectContainer, { autoAlpha: 1 });
                    const winhubObject = subpageSplineApp ? subpageSplineApp.findObjectByName("Winhub") : null;
                    if (winhubObject) {
                        winhubObject.visible = true;
                    }
                }
            });
        }});
    }

    if (subPageBackgroundSphere && subPageBackgroundSphere.valid !== false && subPageBackgroundSphere.introAnimate) {
        subPageBackgroundSphere.introAnimate(
            { from: 1.5, to: 1, duration: 1.8, ease: "power2.out", delay: 0.3 },
            { fromY: degToRad(90), toY: 0, duration: 2.2, ease: "power2.out", delay: 0.3 }
        );
    }

    setupSubPageContentAnimations();
    setupHeroParallax(); 
    setupHeroColorSwitcher();
    setupHeroScrollSnap(); // 스냅 기능 재활성화
    setupTabs();
    setupScrollToTopButton();
    setupSubPageScrollIconAnimation();

    window.scrollTo(0, 0);
    ScrollTrigger.refresh(true);
    if(subpageBodyElement) subpageBodyElement.style.overflow = 'auto'; else document.body.style.overflow = 'auto';
}

function handleSubPageResize() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
   
    const gnbContainer = document.querySelector('.gnb-container');
    if (gnbContainer) {
        gnbHeight = gnbContainer.offsetHeight;
    }
   
    isSnapping = false; // 리사이즈 시 스냅 상태 초기화
    isResizing = true; // 리사이즈 시작 시 플래그 설정

    window.scrollTo({top: 0, behavior: "auto"}); // 즉시 맨 위로 스크롤

    killAllScrollTriggers(); // 모든 ScrollTrigger 죽이기

    if (splitTitle && typeof splitTitle.revert === 'function') { splitTitle.revert(); splitTitle = null; }
    if (splitDescription && typeof splitDescription.revert === 'function') { splitDescription.revert(); splitDescription = null; }
    gsap.set([".sub-hero-content .page-title", ".sub-hero-content .page-description"], { clearProps: "all" });

    if (subPageBackgroundSphere && subPageBackgroundSphere._onResize) {
        subPageBackgroundSphere._onResize();
    }
    const splineObjectContainer = document.getElementById("threejs-object-container");
    const splineCanvas = document.getElementById('spline-canvas-subpage');
    if (splineObjectContainer && splineCanvas) {
        const containerWidth = splineObjectContainer.offsetWidth;
        const containerHeight = splineObjectContainer.offsetHeight;
        if (containerWidth > 0 && containerHeight > 0) {
            const dpr = window.devicePixelRatio || 1;
            splineCanvas.width = Math.round(containerWidth * dpr);
            splineCanvas.height = Math.round(containerHeight * dpr);
            splineCanvas.style.width = '100%';
            splineCanvas.style.height = '100%';
            if (subpageSplineApp && typeof subpageSplineApp.resize === 'function') {
                subpageSplineApp.resize();
            }
        }
    }

    initialPageVisualSetup(true); // 시각적 설정 재조정
   
    // 모든 기능 재설정
    setupSubPageContentAnimations();
    setupTabs();
    setupHeroParallax(); 
    setupHeroColorSwitcher();
    setupHeroScrollSnap(); 
    setupSubPageScrollIconAnimation();
    setupScrollToTopButton();

    // 충분한 지연 시간 후 ScrollTrigger 새로 고치기 및 isResizing 플래그 해제
    gsap.delayedCall(0.5, () => { // 지연 시간을 0.5초로 늘림
        ScrollTrigger.refresh(true);
        ScrollTrigger.update();
        isResizing = false; // 리사이즈 완료 후 플래그 해제

        const subHeroContentOnResize = document.querySelector(".sub-hero-content");
        if (subHeroContentOnResize) {
            gsap.set(subHeroContentOnResize, { autoAlpha: 1 });
            const textAnim = animateHeroText();
             textAnim.eventCallback("onComplete", () => {
                if (splineObjectContainer && splineIntroPlayed) {
                    gsap.set(splineObjectContainer, { autoAlpha: 1 });
                    const winhubObject = subpageSplineApp ? subpageSplineApp.findObjectByName("Winhub") : null;
                    
                    // 원본 상태값이 저장되어 있는지 확인 후 진행
                    if (winhubObject && originalWinhubState) {
                        winhubObject.visible = true;

                        // 리사이즈된 화면 크기에 맞는 속성 가져오기
                        const responsiveProps = getResponsiveSplineProperties();
                        
                        // 목표 상태 계산
                        const targetScale = {
                            x: originalWinhubState.scale.x * responsiveProps.scaleMultiplier,
                            y: originalWinhubState.scale.y * responsiveProps.scaleMultiplier,
                            z: originalWinhubState.scale.z * responsiveProps.scaleMultiplier
                        };
                        const targetPosition = {
                            x: originalWinhubState.position.x,
                            y: originalWinhubState.position.y + responsiveProps.positionYOffset,
                            z: originalWinhubState.position.z
                        };

                        // 애니메이션 없이 즉시 최종 상태로 설정
                        gsap.set(winhubObject.scale, targetScale);
                        gsap.set(winhubObject.rotation, {x: degToRad(0), y: degToRad(90), z: degToRad(0)});
                        gsap.set(winhubObject.position, targetPosition);
                    }
                }
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    setupScrollRestoration();
    splineIntroPlayed = false;
    // 원본 상태 변수 초기화
    originalWinhubState = null;

    try {
        await loadCommonUI();
        const gnbContainer = document.querySelector('.gnb-container');
        if (gnbContainer) {
            gnbHeight = gnbContainer.offsetHeight;
        }

        initializeSubpage().catch(error => {
            console.error("SUB-APP: Error during subpage initialization:", error);
            hideLoader({ onCompleteUser: () => { /* Optional: Fallback UI setup */ }});
        });
    } catch (error) {
        console.error("SUB-APP: Failed to load common UI or initialize its scripts:", error);
        hideLoader().finally(() => {
            const bodyToUse = document.querySelector('.subpage-body') || document.body;
            bodyToUse.style.opacity = '1';
            bodyToUse.style.visibility = 'visible';
            bodyToUse.style.overflow = 'auto';
            if (typeof gsap !== 'undefined') gsap.set(bodyToUse, { autoAlpha: 1 });
        });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleSubPageResize, 250);
    });
});
