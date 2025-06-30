// -----------------------------------------
// sub-app.js
// Description: Script for subpages.
// Imports: SplineRuntime, THREE, GSAP, SplitText, common-utils.js
// -----------------------------------------

import { Application as SplineRuntimeApp } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
window.THREE = THREE;

import { ScrollToPlugin } from "https://esm.sh/gsap/ScrollToPlugin";
import { SplitText } from "https://esm.sh/gsap/SplitText"; // SplitText 임포트 확인

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin);
    if (typeof SplitText !== 'undefined') {
        gsap.registerPlugin(SplitText); // SplitText 플러그인 등록
        // console.log("SUB-APP: GSAP ScrollToPlugin and SplitText registered.");
    } else {
        console.error("SUB-APP: SplitText not loaded, cannot register plugin. Text animations will use fallbacks.");
    }
} else {
    console.error("SUB-APP: GSAP core not loaded, cannot register plugins.");
}


import {
    setupScrollRestoration,
    degToRad,
    startLoaderBarAnimation,
    hideLoader,
    InteractiveBackgroundSphere,
    setupMenu,
    setupMenuLinkEffects,
    loadSplineScene,
    killAllScrollTriggers,
    killScrollTriggersByPattern
} from './common-utils.js';

// --- Subpage Specific Global Variables ---
let subpageSplineApp = null;
let subPageBackgroundSphere = null;
let subpageBodyElement = null;
let splitTitle = null; // 히어로 제목용
let splitDescription = null; // 히어로 설명용
let heroSection = null; // heroSection을 전역 변수로 사용 가능하도록 추가


const HERO_AREA_BACKGROUND_COLOR = "#292c35";

const pageColorConfigs = {
    "default": {
        bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR,
        sphereColor: new THREE.Color(0xffffff),
        textColor: "#ffffff"
    },
    "about.html": {
        bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR,
        sphereColor: new THREE.Color(0xeaf2f8),
        textColor: "#fdfefe"
    },
    "work.html": {
        bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR,
        sphereColor: new THREE.Color(0xf5eef8),
        textColor: "#fcfafc"
    },
};

const scrolledPastHeroColors = {
    bodyBackgroundColorFallback: "#f0f0f0",
    sphereColor: new THREE.Color(0x999999),
    textColor: "#2c3e50"
};

function getCurrentPageConfig() {
    const pathname = window.location.pathname.split('/').pop() || "default";
    return pageColorConfigs[pathname] || pageColorConfigs["default"];
}
const currentPageConfig = getCurrentPageConfig();

// -----------------------------------------
// Subpage Specific Animation & Setup Functions
// -----------------------------------------

function initialPageVisualSetup() {
    if (typeof gsap === 'undefined') {
        console.error("SUB-APP: GSAP not loaded for initialPageVisualSetup.");
        return;
    }
    subpageBodyElement = document.querySelector('.subpage-body');
    if (!subpageBodyElement) {
        console.error("SUB-APP: .subpage-body element not found!");
        return;
    }
    heroSection = document.getElementById("sub-hero"); // heroSection 초기화

    gsap.set("#sub-hero", { autoAlpha: 1 });
    gsap.set(".sub-hero-content", { autoAlpha: 0 });
    // 애니메이션 시작 전에 명확하게 숨김 처리
    gsap.set([".sub-hero-content .page-title", ".sub-hero-content .page-description"], { autoAlpha: 0, y: 0, xPercent: 0 });


    const nonHeroSections = gsap.utils.toArray(".subpage-section:not(#sub-hero)");
    nonHeroSections.forEach(section => {
        gsap.set(section, { autoAlpha: 0 });
        const wrapper = section.querySelector(".section-content-wrapper");
        if (wrapper) {
            gsap.set(wrapper, { autoAlpha: 0, y: 50 });
            const animatedContent = wrapper.querySelector(".animated-content");
            if (animatedContent) {
                gsap.set(animatedContent, { opacity: 0, y: 20 });
            }
        } else {
            gsap.set(section, { autoAlpha: 0, y: 50 });
        }
    });

    const splineContainer = document.getElementById("threejs-object-container");
    if (splineContainer) {
        gsap.set(splineContainer, { autoAlpha: 0 });
    }

    subpageBodyElement.style.backgroundColor = currentPageConfig.bodyBackgroundColorFallback;

    const heroStateLightElements = [
        ...document.querySelectorAll(".com-name-logo.logo-class"),
        ...document.querySelectorAll(".menu-icon")
    ];
    heroStateLightElements.forEach(el => gsap.set(el, { color: currentPageConfig.textColor }));

    let initialDarkTextElements = [];
    document.querySelectorAll(".subpage-section:not(#sub-hero)").forEach(section => {
        const wrapper = section.querySelector(".section-content-wrapper");
        if (wrapper) {
            initialDarkTextElements.push(
                ...wrapper.querySelectorAll('h2, h3, p, .tab-button, span.content-class, a.content-class, div.content-class')
            );
        }
        initialDarkTextElements.push(...section.querySelectorAll('.content-class, h2, h3, p'));
    });
    initialDarkTextElements.push(...document.querySelectorAll("footer.subpage-footer .content-class, footer.subpage-footer span, footer.subpage-footer a"));
    initialDarkTextElements = initialDarkTextElements.filter((el, index, self) =>
        self.indexOf(el) === index &&
        !heroStateLightElements.includes(el) &&
        el.closest('#sub-hero') === null &&
        (el.textContent.trim() !== "" || el.children.length > 0 || ['IMG', 'SVG'].includes(el.tagName))
    );
    initialDarkTextElements.forEach(el => {
        gsap.set(el, { color: scrolledPastHeroColors.textColor });
    });
}

function setupHeroScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !subpageBodyElement || !heroSection) {
        console.error("SUB-APP: GSAP, ScrollTrigger, .subpage-body, or heroSection not available for setupHeroScrollTrigger.");
        return;
    }
    const splineObjectContainer = document.getElementById("threejs-object-container");

    const heroDependentElements = [
        ...document.querySelectorAll(".com-name-logo.logo-class"),
        ...document.querySelectorAll(".menu-icon")
    ];
    const heroTextElements = [
        ...heroSection.querySelectorAll(".page-title.title-class"),
        ...heroSection.querySelectorAll(".page-description.content-class")
    ];

    let otherContentTextElements = [];
    document.querySelectorAll(".subpage-section:not(#sub-hero)").forEach(section => {
        const wrapper = section.querySelector(".section-content-wrapper");
        if (wrapper) {
            otherContentTextElements.push(
                ...wrapper.querySelectorAll('h2, h3, p, .tab-button, span.content-class, a.content-class, div.content-class')
            );
        }
         otherContentTextElements.push(...section.querySelectorAll('.content-class, h2, h3, p'));
    });
    otherContentTextElements.push(...document.querySelectorAll("footer.subpage-footer .content-class, footer.subpage-footer span, footer.subpage-footer a"));

    otherContentTextElements = otherContentTextElements.filter((el, index, self) =>
        self.indexOf(el) === index &&
        !heroDependentElements.includes(el) &&
        !heroTextElements.includes(el) &&
        el.closest('#sub-hero') === null &&
        (el.textContent.trim() !== "" || el.children.length > 0 || ['IMG', 'SVG'].includes(el.tagName))
    );

    ScrollTrigger.create({
        id: "heroScrollColorTrigger",
        trigger: heroSection,
        start: "top top",
        end: "bottom top",
        invalidateOnRefresh: true,
        onLeave: () => {
            subpageBodyElement.classList.add('scrolled-past-hero');
            gsap.to(subpageBodyElement, {
                backgroundColor: scrolledPastHeroColors.bodyBackgroundColorFallback,
                duration: 0.5, overwrite: "auto"
            });
            if (splineObjectContainer) gsap.set(splineObjectContainer, { autoAlpha: 0 });
            if (subPageBackgroundSphere) subPageBackgroundSphere.updateColors({ wireframeColor: scrolledPastHeroColors.sphereColor, pointsColor: scrolledPastHeroColors.sphereColor });

            heroDependentElements.forEach(el => gsap.to(el, { color: scrolledPastHeroColors.textColor, duration: 0.5, overwrite: "auto" }));
            heroTextElements.forEach(el => gsap.to(el, { color: scrolledPastHeroColors.textColor, duration: 0.5, overwrite: "auto" }));
            otherContentTextElements.forEach(el => gsap.to(el, { color: scrolledPastHeroColors.textColor, duration: 0.5, overwrite: "auto" }));
        },
        onEnterBack: () => {
            subpageBodyElement.classList.remove('scrolled-past-hero');
            gsap.to(subpageBodyElement, {
                backgroundColor: currentPageConfig.bodyBackgroundColorFallback,
                duration: 0.5, overwrite: "auto"
            });
            if (splineObjectContainer) gsap.set(splineObjectContainer, { autoAlpha: 1 });
            if (subPageBackgroundSphere) subPageBackgroundSphere.updateColors({ wireframeColor: currentPageConfig.sphereColor, pointsColor: currentPageConfig.sphereColor });

            heroDependentElements.forEach(el => gsap.to(el, { color: currentPageConfig.textColor, duration: 0.5, overwrite: "auto" }));
            heroTextElements.forEach(el => gsap.to(el, { color: currentPageConfig.textColor, duration: 0.5, overwrite: "auto" }));
            otherContentTextElements.forEach(el => {
                gsap.to(el, { color: scrolledPastHeroColors.textColor, duration: 0.5, overwrite: "auto" });
            });
        }
    });
}

function setupSubPageContentAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("SUB-APP: GSAP or ScrollTrigger not loaded for setupSubPageContentAnimations.");
        return;
    }
    const sections = gsap.utils.toArray(".subpage-section:not(#sub-hero)");
    if (sections.length === 0) {
        return;
    }

    sections.forEach((section, index) => {
        const wrapper = section.querySelector(".section-content-wrapper");
        const animatedContentInWrapper = wrapper ? wrapper.querySelector(".animated-content") : null;
        const mainAnimatedElement = wrapper || section;

        ScrollTrigger.create({
            id: `contentAnimationTrigger-${index}`,
            trigger: section,
            start: "top 85%",
            end: "bottom 15%",
            onEnter: () => {
                gsap.to(section, { autoAlpha: 1, duration: 0.2 });
                gsap.to(mainAnimatedElement, {
                    autoAlpha: 1, y: 0, duration: 0.8,
                    ease: "power2.out", delay: 0.1,
                    onComplete: () => {
                        if (animatedContentInWrapper) {
                            gsap.to(animatedContentInWrapper, {
                                opacity: 1, y: 0, duration: 0.6,
                                ease: "power2.out", delay: 0.1
                            });
                        }
                    }
                });
            },
            onEnterBack: () => {
                gsap.to(section, { autoAlpha: 1, duration: 0.2 });
                gsap.to(mainAnimatedElement, {
                    autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out",
                    onComplete: () => {
                        if (animatedContentInWrapper) {
                            gsap.to(animatedContentInWrapper, {
                                opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.1
                            });
                        }
                    }
                });
            },
            onLeaveBack: () => {
                if (animatedContentInWrapper) {
                    gsap.to(animatedContentInWrapper, {
                        opacity: 0, y: 20, duration: 0.3, ease: "power1.in"
                    });
                }
                gsap.to(mainAnimatedElement, {
                    autoAlpha: 0, y: 50, duration: 0.4,
                    ease: "power1.in", delay: animatedContentInWrapper ? 0.1 : 0
                });
                gsap.to(section, { autoAlpha: 0, duration: 0.1, delay: 0.4 });
            },
            toggleActions: "play none none reverse"
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
        // console.warn("SUB-APP: .sub-hero-content not found for text animation.");
        return;
    }

    const pageTitle = subHeroContent.querySelector(".page-title");
    const pageDescription = subHeroContent.querySelector(".page-description");

    if (splitTitle && typeof splitTitle.revert === 'function') {
        splitTitle.revert();
    }
    if (splitDescription && typeof splitDescription.revert === 'function') {
        splitDescription.revert();
    }
    splitTitle = null;
    splitDescription = null;
    // 애니메이션 시작 전 상태 초기화 (clearProps로 이전 GSAP 속성 제거)
    gsap.set([pageTitle, pageDescription], { autoAlpha: 0, y: 0, xPercent: 0, clearProps: "all" });


    if (pageTitle && pageTitle.offsetParent !== null) {
        gsap.set(pageTitle, { autoAlpha: 1 }); // 애니메이션을 위해 보이도록 설정
        if (typeof SplitText !== 'undefined') {
            try {
                splitTitle = new SplitText(pageTitle, { type: "chars" });
                if (splitTitle.chars && splitTitle.chars.length > 0) {
                    gsap.fromTo(splitTitle.chars,
                        { // 시작 상태
                            autoAlpha: 0,
                            xPercent: 100, // 오른쪽에서 시작 (index.html 헤드라인과 유사)
                        },
                        { // 종료 상태
                            autoAlpha: 1,
                            xPercent: 0,
                            duration: 0.6,
                            stagger: 0.04,
                            ease: "circ.out", // index.html 헤드라인과 유사한 ease
                        }
                    );
                } else {
                    gsap.fromTo(pageTitle, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power2.out" });
                }
            } catch (e) {
                console.error("SUB-APP: Error during pageTitle SplitText. Fallback.", e);
                gsap.fromTo(pageTitle, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power2.out" });
            }
        } else {
            gsap.fromTo(pageTitle, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power2.out" });
        }
    }


    if (pageDescription && pageDescription.offsetParent !== null) {
         gsap.set(pageDescription, { autoAlpha: 1 }); // 애니메이션을 위해 보이도록 설정
        if (typeof SplitText !== 'undefined') {
            try {
                splitDescription = new SplitText(pageDescription, { type: "lines" });
                if (splitDescription.lines && splitDescription.lines.length > 0) {
                    gsap.fromTo(splitDescription.lines,
                        { // 시작 상태
                            autoAlpha: 0,
                            y: 30, // 아래에서 시작
                        },
                        { // 종료 상태
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.6,
                            stagger: 0.15,
                            ease: "power2.out",
                            delay: (splitTitle && splitTitle.chars && splitTitle.chars.length > 0) ? 0.4 : 0.1,
                        }
                    );
                } else {
                    gsap.fromTo(pageDescription, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.3 });
                }
            } catch (e) {
                console.error("SUB-APP: Error during pageDescription SplitText. Fallback.", e);
                gsap.fromTo(pageDescription, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.3 });
            }
        } else {
            gsap.fromTo(pageDescription, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.3 });
        }
    }
}
function setupScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (!scrollToTopBtn) {
        console.warn("MAIN-APP: Scroll to Top button (#scrollToTopBtn) not found.");
        return;
    }

    window.addEventListener("scroll", () => {
        if (window.scrollY > window.innerHeight / 2) {
            if (!scrollToTopBtn.classList.contains("show")) {
                scrollToTopBtn.classList.add("show");
            }
        } else {
            if (scrollToTopBtn.classList.contains("show")) {
                scrollToTopBtn.classList.remove("show");
            }
        }
    });

    scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
    console.log("MAIN-APP: Scroll to Top button setup complete.");
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
                if (!subpageSplineApp && splineObjectContainer) gsap.set(splineObjectContainer, { display: 'none' });
                return app;
            }).catch(error => {
                console.error("SUB-APP: Error loading subpage Spline scene:", error);
                if (splineObjectContainer) gsap.set(splineObjectContainer, { display: 'none' });
                return null;
            });
        criticalLoadPromises.push(splineLoadPromise);
    } else {
        if (splineObjectContainer) gsap.set(splineObjectContainer, { display: 'none' });
    }

    try {
        await loaderBarPromise;
        if (criticalLoadPromises.length > 0) await Promise.all(criticalLoadPromises);
    } catch (error) { console.error("SUB-APP: Error during critical loading or loader bar:", error); }

    await hideLoader({ fadeDuration: 0.4 });

    const menuIconElement = document.querySelector(".menu-icon");
    if (menuIconElement) {
        gsap.to(menuIconElement, {
            duration: 0.8, autoAlpha: 1, ease: "power2.out", delay: 0.2
        });
    }

    const subHeroContent = document.querySelector(".sub-hero-content");
    if (subHeroContent) {
        // subHeroContent 자체를 먼저 보이게 하고, 그 다음에 내부 텍스트 애니메이션 실행
        gsap.to(subHeroContent, {
            autoAlpha: 1, duration: 0.1, // 매우 짧게 하여 거의 즉시 보이도록
            onComplete: animateHeroText // 완료 후 텍스트 애니메이션 호출
        });
    }

    if (subPageBackgroundSphere && subPageBackgroundSphere.valid !== false && subPageBackgroundSphere.introAnimate) {
        subPageBackgroundSphere.introAnimate(
            { from: 1.5, to: 1, duration: 1.5, ease: "power2.out", delay: 0.2 },
            { fromY: Math.PI, toY: 0, duration: 2.0, ease: "power2.out", delay: 0.2 }
        );
    }

    if (subpageSplineApp && splineObjectContainer) {
        if (window.scrollY === 0 && heroSection && ScrollTrigger.isInViewport(heroSection, 0.5, true)) {
             gsap.set(splineObjectContainer, { autoAlpha: 1 });
        } else if (window.scrollY > 0) {
             gsap.set(splineObjectContainer, { autoAlpha: 0 });
        }


        const splineMainObject = subpageSplineApp.findObjectByName("Winhub");
        if (splineMainObject) {
            gsap.set(splineMainObject.scale, { x: 1.9, y: 1.9, z: 1.9 });
            gsap.set(splineMainObject.rotation, { x: degToRad(0), y: degToRad(180), z: degToRad(0) });
            gsap.set(splineMainObject.position, { x: 0, y: -30, z: 0 });

            const splineIntroTl = gsap.timeline({ delay: 0.5 });
            splineIntroTl.to(splineMainObject.scale, {
                x: 1.4, y: 1.4, z: 1.4, duration: 1.2, ease: "power3.out"
            })
            .to(splineMainObject.rotation, {
                x: degToRad(60), y: degToRad(60), z: degToRad(-40), duration: 1.5, ease: "power3.out"
            }, "<")
            .to(splineMainObject.position, {
                x: 300, y: 0, z: 0, duration: 1.2, ease: "power3.out"
            }, "<");
        } else { console.warn("SUB-APP: Spline main object ('Winhub') not found."); }
    }

    setupMenu("menu-toggle", "menu-overlay", "menu-close", ".menu-links .top-link a");
    if (typeof setupMenuLinkEffects === 'function') setupMenuLinkEffects();
    else console.error("SUB-APP: setupMenuLinkEffects is not a function!");

    setupSubPageContentAnimations();
    setupHeroScrollTrigger();
    setupTabs();
setupScrollToTopButton();
    ScrollTrigger.refresh();
    if(subpageBodyElement) subpageBodyElement.style.overflow = 'auto';
    else document.body.style.overflow = 'auto';
}

function handleSubPageResize() {
    killAllScrollTriggers();

    if (splitTitle && typeof splitTitle.revert === 'function') {
        splitTitle.revert();
        splitTitle = null;
    }
    if (splitDescription && typeof splitDescription.revert === 'function') {
        splitDescription.revert();
        splitDescription = null;
    }
    gsap.set([".sub-hero-content .page-title", ".sub-hero-content .page-description"], { clearProps: "all" });


    if (subPageBackgroundSphere && subPageBackgroundSphere._onResize) subPageBackgroundSphere._onResize();

    initialPageVisualSetup();

    setupSubPageContentAnimations();
    setupHeroScrollTrigger();
    setupTabs();

    ScrollTrigger.refresh(true);

    const subHeroContent = document.querySelector(".sub-hero-content");
    if (subHeroContent) {
        gsap.to(subHeroContent, {
            autoAlpha: 1,
            duration: 0.1,
            onComplete: () => {
                animateHeroText();
            }
        });
    }

    const splineObjectContainer = document.getElementById("threejs-object-container");
    if (splineObjectContainer && heroSection) {
        const heroRect = heroSection.getBoundingClientRect();
        if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
            gsap.set(splineObjectContainer, { autoAlpha: 1 });
        } else {
            gsap.set(splineObjectContainer, { autoAlpha: 0 });
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setupScrollRestoration();
    initializeSubpage().catch(error => {
        console.error("SUB-APP: Error during subpage initialization:", error);
        hideLoader({ onCompleteUser: () => {
            const bodyToUse = document.querySelector('.subpage-body') || document.body;
            bodyToUse.style.opacity = '1';
            bodyToUse.style.visibility = 'visible';
            bodyToUse.style.overflow = 'auto';
            if (typeof gsap !== 'undefined') gsap.set(bodyToUse, { autoAlpha: 1 });
        }});
    });
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleSubPageResize, 250);
    });
});
