// assets/js/sub-app.js

import { ScrollToPlugin } from "https://esm.sh/gsap/ScrollToPlugin";
import { SplitText } from "https://esm.sh/gsap/SplitText";

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin, SplitText, ScrollTrigger);
}

// [개선] common-utils.js에서 필요한 유틸리티 함수들을 가져옵니다.
import {
    setupScrollRestoration,
    degToRad,
    runLoaderSequence,
    hideLoaderOnError,
    killAllScrollTriggers,
    loadCommonUI,
    disableScrollInteraction,
    enableScrollInteraction
} from './common-utils.js';

// --- Global Variables for Sub Page ---
let subpageSplineApp = null;
let subPageBackgroundSphere = null;
let subpageBodyElement = null;
let splitTitle = null;
let splitDescription = null;
let heroSection = null;
let splineIntroPlayed = false;
let gnbHeight = 0;
let isSnapping = false;
let isResizing = false;
let cachedWindowWidth = window.innerWidth;
let originalWinhubState = null;

// --- Configuration ---
const HERO_AREA_BACKGROUND_COLOR = "#292c35";
const pageColorConfigs = {
    "default": { bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR, sphereColor: { r: 1, g: 1, b: 1 }, textColor: "#ffffff" },
    "about.html": { bodyBackgroundColorFallback: "#1f7277", sphereColor: { r: 0.917, g: 0.949, b: 0.972 }, textColor: "#fdfefe" },
    "works.html": { bodyBackgroundColorFallback: "#1f3477", sphereColor: { r: 0.682, g: 0.839, b: 0.945 }, textColor: "#ecf0f1" },
    "contact.html": { bodyBackgroundColorFallback: "#491e9b", sphereColor: { r: 0.682, g: 0.839, b: 0.945 }, textColor: "#ecf0f1" },
};
const scrolledPastHeroColors = {
    sphereColor: { r: 0.6, g: 0.6, b: 0.6 },
    darkContentTextColor: "#2c3e50"
};

function getResponsiveSplineProperties() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        return {
            scaleMultiplier: 1.4,
            positionX: 400,
            positionYOffset: -150
        };
    }
    return {
        scaleMultiplier: 1.0,
        positionX: 300,
        positionYOffset: 0
    };
}

function getCurrentPageConfig() {
    const pathname = window.location.pathname.split('/').pop() || "default";
    const config = pageColorConfigs[pathname] || pageColorConfigs["default"];
    return config;
}
const currentPageConfig = getCurrentPageConfig();


// --- Animation Functions (기존 함수들 유지) ---
function setupDecorativeRectAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    const section = document.querySelector("#sub-section-1");
    if (!section) return;

    const rect1 = section.querySelector(".rect-random");
    const rect2 = section.querySelector(".rect-random2");
    const parallaxBg = rect1 ? rect1.querySelector(".parallax-bg") : null;
    const parallaxBg2 = rect2 ? rect2.querySelector(".parallax-bg") : null;

    if (rect1) {
        gsap.set(rect1, {
            clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
            autoAlpha: 1
        });

        ScrollTrigger.create({
            trigger: section,
            start: "top 75%",
            end: "bottom 25%",
            id: 'rect1-anim',
            invalidateOnRefresh: true,
            onEnter: () => gsap.to(rect1, {
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                duration: 1.2,
                ease: 'expo.out'
            }),
            onLeave: () => gsap.to(rect1, {
                clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
                duration: 0.8,
                ease: 'power3.in'
            }),
            onEnterBack: () => gsap.to(rect1, {
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                duration: 1.2,
                ease: 'expo.out'
            }),
            onLeaveBack: () => gsap.to(rect1, {
                clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
                duration: 0.8,
                ease: 'power3.in'
            })
        });

        if (parallaxBg) {
             gsap.fromTo(parallaxBg, {yPercent: -15}, {
                yPercent: 15,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                    id: 'rect1-parallax',
                    invalidateOnRefresh: true
                }
            });
        }
        if (parallaxBg2) {
             gsap.fromTo(parallaxBg2, {yPercent: -15}, {
                yPercent: 15,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 1.5,
                    id: 'rect1-parallax',
                    invalidateOnRefresh: true
                }
            });
        }
    }

    if (rect2) {
        gsap.set(rect2, {
            clipPath: 'polygon(100% 100%, 100% 100%, 0% 100%, 0% 100%)',
            autoAlpha: 1
        });

        ScrollTrigger.create({
            trigger: section,
            start: "top 70%",
            end: "bottom 30%",
            id: 'rect2-anim',
            invalidateOnRefresh: true,
            onEnter: () => gsap.to(rect2, {
                clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%)',
                duration: 1.2,
                ease: 'expo.out'
            }),
            onLeave: () => gsap.to(rect2, {
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
                duration: 0.8,
                ease: 'power3.in'
            }),
            onEnterBack: () => gsap.to(rect2, {
                clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%)',
                duration: 1.2,
                ease: 'expo.out'
            }),
            onLeaveBack: () => gsap.to(rect2, {
                clipPath: 'polygon(100% 100%, 100% 100%, 0% 100%, 0% 100%)',
                duration: 0.8,
                ease: 'power3.in'
            })
        });
    }
}

function setupLottieScrollTrigger() {
    const lottiePlayer = document.querySelector("#overview-lottie");
    if (!lottiePlayer || typeof ScrollTrigger === 'undefined') {
        return;
    }
    lottiePlayer.loop = true;

    const st = ScrollTrigger.create({
        trigger: lottiePlayer.parentElement,
        start: "top 80%",
        end: "bottom 20%",
        id: 'lottie-overview-trigger',
        invalidateOnRefresh: true,
        onEnter: () => {
            lottiePlayer.seek(0);
            lottiePlayer.play();
        },
        onEnterBack: () => {
            lottiePlayer.seek(0);
            lottiePlayer.play();
        },
        onLeave: () => {
            lottiePlayer.pause();
        },
        onLeaveBack: () => {
            lottiePlayer.pause();
        },
        enabled: false
    });

    lottiePlayer.addEventListener('ready', () => {
        lottiePlayer.stop();
        if (st) {
            st.enable();
        }
    });
}

function setupHistoryTimelineAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const timelineEntries = gsap.utils.toArray('.timeline-entry');
    if (!timelineEntries.length) return;

    timelineEntries.forEach(entry => {
        const xFrom = entry.classList.contains('left-entry') ? -100 : 100;

        gsap.set(entry, { autoAlpha: 0, x: xFrom, y: 30 });
        gsap.to(entry, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: entry,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
                invalidateOnRefresh: true
            }
        });
    });
}

function setupHistorySectionAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const historySectionWrapper = document.querySelector("#history-section .section-content-wrapper");
    const historyTitle = historySectionWrapper ? historySectionWrapper.querySelector('.section-title') : null;

    if (historyTitle) {
        gsap.set(historyTitle, { opacity: 0, y: 50 });
        gsap.to(historyTitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: historySectionWrapper,
                start: "top 85%",
                toggleActions: 'play none none reverse',
                invalidateOnRefresh: true,
            }
        });
    }

    setupHistoryTimelineAnimation();
}

function setupPartnersSectionAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const section = document.querySelector("#partners-section");
    if (!section) return;

    const wrapper = section.querySelector(".section-content-wrapper");

    if (wrapper) {
        gsap.set(wrapper, { opacity: 0, y: 50 });

        ScrollTrigger.create({
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            invalidateOnRefresh: true,
            onEnter: () => gsap.to(wrapper, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", overwrite: "auto" }),
            onLeave: () => gsap.to(wrapper, { opacity: 0, y: -50, duration: 0.4, ease: "power1.in", overwrite: "auto" }),
            onEnterBack: () => gsap.to(wrapper, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }),
            onLeaveBack: () => gsap.to(wrapper, { opacity: 0, y: 50, duration: 0.4, ease: "power1.in", overwrite: "auto" }),
        });
    }
}

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
            if (section.id === 'history-section') {
                gsap.set(wrapper.querySelector('.section-title'), { opacity: 0, y: 50 });
                gsap.set(gsap.utils.toArray('.timeline-entry'), { opacity: 0 });
            } else {
                const animatedContent = wrapper.querySelector(".animated-content");
                if (animatedContent) {
                    gsap.set(animatedContent, { opacity: 0, y: 50 });
                } else {
                    gsap.set(wrapper, { opacity: 0, y: 50 });
                }
            }
        } else {
            gsap.set(section, { opacity: 0, y: 50 });
        }
    });

    const splineContainer = document.getElementById("threejs-object-container");
    if (splineContainer && !isResize) {
        gsap.set(splineContainer, { autoAlpha: 0 });
    }

    gsap.set(subpageBodyElement, { backgroundColor: currentPageConfig.bodyBackgroundColorFallback });
    subpageBodyElement.classList.remove('scrolled-past-hero-colors');

    const heroDependentElements = getHeroDependentElements();
    const heroTextElements = getHeroTextElements();
    const otherContentElements = getOtherContentTextElements();

    heroDependentElements.forEach(el => gsap.set(el, { color: currentPageConfig.textColor }));
    heroTextElements.forEach(el => gsap.set(el, { color: currentPageConfig.textColor }));
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
function switchColors(isScrolledPast, THREE) {
    const heroDependentElements = getHeroDependentElements();
    const otherContentTextElements = getOtherContentTextElements();

    const duration = 0.5;

    if (isScrolledPast) {
        subpageBodyElement.classList.add('scrolled-past-hero-colors');
    } else {
        subpageBodyElement.classList.remove('scrolled-past-hero-colors');
    }

    if (subPageBackgroundSphere && THREE) {
        const targetSphereColors = isScrolledPast ? new THREE.Color(scrolledPastHeroColors.sphereColor.r, scrolledPastHeroColors.sphereColor.g, scrolledPastHeroColors.sphereColor.b) : new THREE.Color(currentPageConfig.sphereColor.r, currentPageConfig.sphereColor.g, currentPageConfig.sphereColor.b);
        subPageBackgroundSphere.updateColors({
            wireframeColor: targetSphereColors,
            pointsColor: targetSphereColors
        });
    }

    const logoMenuColorScrolledPast = scrolledPastHeroColors.darkContentTextColor;
    const logoMenuColorInHero = currentPageConfig.textColor;
    heroDependentElements.forEach(el => gsap.to(el, {
        color: isScrolledPast ? logoMenuColorScrolledPast : logoMenuColorInHero,
        duration: duration,
        overwrite: "auto"
    }));

    const contentTargetTextColor = isScrolledPast ? scrolledPastHeroColors.darkContentTextColor : currentPageConfig.textColor;
    otherContentTextElements.forEach(el => gsap.to(el, {
        color: contentTargetTextColor,
        duration: duration,
        overwrite: "auto"
    }));
 }
function setupHeroColorSwitcher(THREE) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !subpageBodyElement || !heroSection) return;

    const existingTrigger = ScrollTrigger.getById("heroColorSwitcher");
    if (existingTrigger) existingTrigger.kill();

    ScrollTrigger.create({
        id: "heroColorSwitcher",
        trigger: heroSection,
        start: "bottom 80%",
        toggleActions: "play none none reverse",
        onEnter: () => switchColors(true, THREE),
        onLeaveBack: () => switchColors(false, THREE),
        invalidateOnRefresh: true,
    });
 }
function setupHeroParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !heroSection) return;

    const subHeroContent = heroSection.querySelector(".sub-hero-content");
    const splineObjectContainer = document.getElementById("threejs-object-container");
    const backgroundContainer = document.getElementById('fullscreen-threejs-bg');

    const existingParallaxTrigger = ScrollTrigger.getById("heroParallax");
    if (existingParallaxTrigger) existingParallaxTrigger.kill();

    const parallaxTl = gsap.timeline({
        scrollTrigger: {
            id: "heroParallax",
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
            invalidateOnRefresh: true,
        }
    });

    if (subHeroContent) parallaxTl.to(subHeroContent, { yPercent: -80, ease: "none" }, 0);
    if (splineObjectContainer) parallaxTl.to(splineObjectContainer, { yPercent: -40, scale: 0.9, ease: "none" }, 0);
    if (backgroundContainer) parallaxTl.to(backgroundContainer, { yPercent: -20, ease: "none" }, 0);

    const existingVisibilityTrigger = ScrollTrigger.getById("heroVisibilityTrigger");
    if (existingVisibilityTrigger) existingVisibilityTrigger.kill();

    ScrollTrigger.create({
        id: "heroVisibilityTrigger",
        trigger: heroSection,
        start: "top top",
        end: "bottom top",
        invalidateOnRefresh: true,
        onLeave: () => gsap.to([subHeroContent, splineObjectContainer], { autoAlpha: 0, duration: 0.3 }),
        onEnterBack: () => {
            gsap.to(splineObjectContainer, { autoAlpha: 1, duration: 0.3 });
            gsap.to(subHeroContent, {
                autoAlpha: 1,
                duration: 0.1,
                onComplete: () => animateHeroText()
            });
        },
    });
 }

function setupSubPageContentAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const sections = gsap.utils.toArray(".subpage-section:not(#sub-hero):not(#history-section):not(#partners-section)");

    sections.forEach((section) => {
        let animatedElement;
        const contentWrapper = section.querySelector(".section-content-wrapper");

        if (contentWrapper) {
            const specificAnimatedContent = contentWrapper.querySelector(".animated-content");
            animatedElement = specificAnimatedContent || contentWrapper;
        } else {
            animatedElement = section;
        }

        gsap.set(animatedElement, { opacity: 0, y: 50 });

        if (section.id === 'contact-section' || section.id === 'map-section') {
            ScrollTrigger.create({
                trigger: section,
                start: "top 85%",
                toggleActions: 'play none none none',
                invalidateOnRefresh: true,
                onEnter: () => gsap.to(animatedElement, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }),
            });
        } else {
            ScrollTrigger.create({
                trigger: section,
                start: "top 80%",
                end: "bottom 20%",
                invalidateOnRefresh: true,
                onEnter: () => gsap.to(animatedElement, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", overwrite: "auto" }),
                onLeave: () => gsap.to(animatedElement, { opacity: 0, y: -50, duration: 0.4, ease: "power1.in", overwrite: "auto" }),
                onEnterBack: () => gsap.to(animatedElement, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }),
                onLeaveBack: () => gsap.to(animatedElement, { opacity: 0, y: 50, duration: 0.4, ease: "power1.in", overwrite: "auto" }),
            });
        }
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
    if (!subHeroContent) return gsap.timeline();

    const pageTitle = subHeroContent.querySelector(".page-title");
    const pageDescription = subHeroContent.querySelector(".page-description");

    if (splitTitle && typeof splitTitle.revert === 'function') splitTitle.revert();
    if (splitDescription && typeof splitDescription.revert === 'function') splitDescription.revert();
    splitTitle = null;
    splitDescription = null;

    gsap.set([pageTitle, pageDescription], { autoAlpha: 0, y: 0, xPercent: 0, clearProps: "all" });
    if (gsap.getProperty(subHeroContent, "autoAlpha") === 0) {
        gsap.set(subHeroContent, {autoAlpha: 1});
    }

    const masterTextAnimationTl = gsap.timeline();

    if (pageTitle && pageTitle.offsetParent !== null) {
        if (typeof SplitText !== 'undefined') {
            try {
                splitTitle = new SplitText(pageTitle, { type: "chars" });
                masterTextAnimationTl.fromTo(splitTitle.chars,
                    { autoAlpha: 0, y: -200 },
                    { duration: .5, autoAlpha: 1, y: 0, ease: "back.out(1.7)", stagger: 0.1 }
                );
            } catch (e) {
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
                masterTextAnimationTl.from(splitDescription.lines, {
                    duration: 0.6, autoAlpha: 0, y: 50, ease: "back.out(1.7)", stagger: 0.1
                }, ">");
            } catch (e) {
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
    const heroSection = document.getElementById('sub-hero');
    if (!scrollToTopBtn || !heroSection) return;

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: heroSection,
            start: "bottom top",
            onEnter: () => scrollToTopBtn.classList.add('show'),
            onLeaveBack: () => scrollToTopBtn.classList.remove('show')
        });
    }
    scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
 }
function setupSubPageScrollIconAnimation() {
    const scrollIcon = document.querySelector("#sub-hero .scroll-icon");
    if (!scrollIcon || typeof ScrollTrigger === 'undefined') return;

    gsap.to(scrollIcon, { autoAlpha: 1, duration: 0.5, delay: 1.5 });

    ScrollTrigger.create({
        id: 'subPageScrollIconVisibilityTrigger',
        start: 1,
        onEnter: () => gsap.to(scrollIcon, { autoAlpha: 0, duration: 0.2 }),
        onLeaveBack: () => gsap.to(scrollIcon, { autoAlpha: 1, duration: 0.2 }),
    });
 }
function setupHeroScrollSnap() {
    if (typeof ScrollToPlugin === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const heroSection = document.getElementById('sub-hero');
    const firstContentSection = document.querySelector('.subpage-section:not(#sub-hero)');
    if (!heroSection || !firstContentSection) return;

    ScrollTrigger.create({
        id: 'heroScrollSnapTrigger',
        trigger: heroSection,
        start: "top top-1",
        end: "bottom top",
        onEnter: self => {
            if (isSnapping || self.direction !== 1 || isResizing) return;
            isSnapping = true;
            gsap.to(window, {
                scrollTo: { y: firstContentSection },
                duration: .35,
                ease: 'power2.inOut',
                onComplete: () => { gsap.delayedCall(0.1, () => { isSnapping = false; }); },
                overwrite: 'auto'
            });
        },
        onEnterBack: self => {
            if (isSnapping || self.direction !== -1 || isResizing) return;
            isSnapping = true;
            gsap.to(window, {
                scrollTo: { y: 0 },
                duration: .35,
                ease: 'power2.inOut',
                onComplete: () => { gsap.delayedCall(0.1, () => { isSnapping = false; }); },
                overwrite: 'auto'
            });
        },
        invalidateOnRefresh: true
    });
 }

// [개선] 3D 에셋 로딩 함수 (애니메이션 시작은 분리)
async function initializeHeavyAssets() {
    try {
        const { Application } = await import('https://unpkg.com/@splinetool/runtime/build/runtime.js');
        const { InteractiveBackgroundSphere, loadSplineScene } = await import('./common-utils.js');
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
        window.THREE = THREE;

        subpageSplineApp = await loadSplineScene("spline-canvas-subpage", "https://prod.spline.design/0FDfaGjmdgz0JYwR/scene.splinecode", Application);
        if (subpageSplineApp) {
            const cableObject = subpageSplineApp.findObjectByName('cable');
            if (cableObject) cableObject.visible = false;
            const winhubObject = subpageSplineApp.findObjectByName('Winhub');
            if (winhubObject && !originalWinhubState) {
                originalWinhubState = {
                    scale: { ...winhubObject.scale },
                    position: { ...winhubObject.position }
                };
            }
        }

        if (subpageBodyElement) {
            const color = new THREE.Color(currentPageConfig.sphereColor.r, currentPageConfig.sphereColor.g, currentPageConfig.sphereColor.b);
            subPageBackgroundSphere = new InteractiveBackgroundSphere('fullscreen-threejs-bg', THREE, {
                wireframeColor: color.clone(),
                pointsColor: color.clone(),
            });
            if (subPageBackgroundSphere.init) {
                // 애니메이션 없이 초기화만 실행
                subPageBackgroundSphere.init();
                // Sphere 메쉬는 처음엔 보이지 않도록 설정
                if(subPageBackgroundSphere.mesh) subPageBackgroundSphere.mesh.visible = false;
            }
        }

        setupHeroColorSwitcher(THREE);
        return true; // 로딩 성공 시 true 반환

    } catch (error) {
        console.error("Error initializing heavy assets on sub-page:", error);
        const splineContainer = document.getElementById("threejs-object-container");
        if (splineContainer) gsap.set(splineContainer, { display: 'none' });
        return false; // 로딩 실패 시 false 반환
    }
}

// [신규] Sphere 인트로 애니메이션 함수
function animateSphereIntro() {
    // Sphere 객체나 메쉬가 없으면 실행하지 않음
    if (!subPageBackgroundSphere || !subPageBackgroundSphere.mesh) {
        // Sphere가 없더라도 Spline 애니메이션은 실행되도록 처리
        playSplineIntroAnimation();
        return;
    };

    const sphereMesh = subPageBackgroundSphere.mesh;
    sphereMesh.visible = true; // 애니메이션 시작 직전에 보이도록 설정

    gsap.timeline({
        onComplete: () => {
            // Sphere 애니메이션이 끝나면 Spline 애니메이션을 시작
            playSplineIntroAnimation();
        }
    })
    .fromTo(sphereMesh.scale,
        { x: 1.5, y: 1.5, z: 1.5 },
        { x: 1, y: 1, z: 1, duration: 1.2, ease: "power2.out" },
        0 // 타임라인 시작과 동시에
    )
    .fromTo(sphereMesh.rotation,
        { y: -Math.PI / 2 },
        { y: 0, duration: 1.5, ease: "power2.out" },
        0 // 타임라인 시작과 동시에
    );
}


// Spline 인트로 애니메이션 함수
function playSplineIntroAnimation() {
    const winhubObject = subpageSplineApp ? subpageSplineApp.findObjectByName("Winhub") : null;
    const splineObjectContainer = document.getElementById("threejs-object-container");

    if (splineObjectContainer && winhubObject && !splineIntroPlayed) {
        splineIntroPlayed = true;
        const responsiveProps = getResponsiveSplineProperties();
        const targetScale = { x: originalWinhubState.scale.x * responsiveProps.scaleMultiplier, y: originalWinhubState.scale.y * responsiveProps.scaleMultiplier, z: originalWinhubState.scale.z * responsiveProps.scaleMultiplier };
        const targetRotation = { x: degToRad(0), y: degToRad(90), z: degToRad(0) };
        const targetPosition = { x: responsiveProps.positionX, y: originalWinhubState.position.y + responsiveProps.positionYOffset, z: originalWinhubState.position.z };

        gsap.timeline()
            .to(splineObjectContainer, { autoAlpha: 1, duration: 1 }, 0)
            .call(() => { if (winhubObject) winhubObject.visible = true; }, null, 0)
            .fromTo(winhubObject.scale, { x: targetScale.x * 0.5, y: targetScale.y * 0.5, z: targetScale.z * 0.5 }, { ...targetScale, duration: 1.5, ease: "power3.out" }, 0.2)
            .fromTo(winhubObject.rotation, { x: degToRad(90), y: degToRad(-360), z: degToRad(5) }, { ...targetRotation, duration: 1.5, ease: "power3.out" }, 0.2)
            .fromTo(winhubObject.position, { x: targetPosition.x - 200, y: targetPosition.y, z: targetPosition.z }, { ...targetPosition, duration: 1.5, ease: "power3.out" }, 0.2);
    }
}


// [개선] 메인 초기화 함수 - 애니메이션 순서 제어 로직 강화
async function initializeSubpage() {
    initialPageVisualSetup();

    await runLoaderSequence('.subpage-container');

    enableScrollInteraction();

    // --- Intro Animation Sequence ---

    const logoElement = document.querySelector(".com-name-logo.logo-class");
    const menuIconElement = document.querySelector(".menu-icon");
    if (logoElement && menuIconElement) {
        gsap.to([logoElement, menuIconElement], {
            duration: 0.8,
            autoAlpha: 1,
            ease: "power2.out",
            delay: 0.2
        });
    }

    const subHeroContent = document.querySelector(".sub-hero-content");
    if (subHeroContent) {
        // 3D 에셋 로딩을 미리 시작 (애니메이션은 아직 안 함)
        const assetsPromise = initializeHeavyAssets();

        gsap.to(subHeroContent, {
            autoAlpha: 1,
            duration: 0.1,
            delay: 0.4,
            onComplete: () => {
                const textAnim = animateHeroText();
                // 텍스트 애니메이션이 끝나면,
                textAnim.eventCallback("onComplete", () => {
                    // 에셋 로딩이 완료되기를 기다렸다가 3D 애니메이션 시작
                    assetsPromise.then(loaded => {
                        if (loaded) {
                            // Sphere 애니메이션을 먼저 시작 (이후 Spline이 연달아 실행됨)
                            animateSphereIntro();
                        }
                    });
                });
            }
        });
    } else {
        // Hero 텍스트가 없으면 바로 3D 에셋 로딩 및 애니메이션 시작
        initializeHeavyAssets().then(loaded => {
            if (loaded) {
                animateSphereIntro();
            }
        });
    }

    // --- 나머지 스크립트 설정 ---
    setupSubPageContentAnimations();
    setupDecorativeRectAnimations();
    setupLottieScrollTrigger();
    setupHistorySectionAnimation();
    setupPartnersSectionAnimation();
    setupHeroParallax();
    setupHeroScrollSnap();
    setupTabs();
    setupScrollToTopButton();
    setupSubPageScrollIconAnimation();

    if (window.location.pathname.includes('works.html')) {
        try {
            const worksModule = await import('./works-specific.js');
            if (worksModule && typeof worksModule.initializePortfolio === 'function') {
                worksModule.initializePortfolio();
            }
        } catch (error) {
            console.error("Failed to load works-specific scripts:", error);
        }
    }

    window.scrollTo(0, 0);
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
    }
}

function handleSubPageResize() {
    if (window.innerWidth !== cachedWindowWidth) {
        isResizing = true;
        cachedWindowWidth = window.innerWidth;
        window.scrollTo({top: 0, behavior: "auto"});
        killAllScrollTriggers();

        if (splitTitle) splitTitle.revert();
        if (splitDescription) splitDescription.revert();
        gsap.set([".sub-hero-content .page-title", ".sub-hero-content .page-description"], { clearProps: "all" });

        if (subPageBackgroundSphere) subPageBackgroundSphere._onResize();
        const winhubObject = subpageSplineApp ? subpageSplineApp.findObjectByName("Winhub") : null;
        if (winhubObject && originalWinhubState) {
            const responsiveProps = getResponsiveSplineProperties();
            const targetScale = { x: originalWinhubState.scale.x * responsiveProps.scaleMultiplier, y: originalWinhubState.scale.y * responsiveProps.scaleMultiplier, z: originalWinhubState.scale.z * responsiveProps.scaleMultiplier };
            const targetPosition = { x: responsiveProps.positionX, y: originalWinhubState.position.y + responsiveProps.positionYOffset, z: originalWinhubState.position.z };
            gsap.to(winhubObject.scale, { ...targetScale, duration: 0.5, ease: "power2.out", overwrite: true });
            gsap.to(winhubObject.position, { ...targetPosition, duration: 0.5, ease: "power2.out", overwrite: true });
        }

        initialPageVisualSetup(true);

        setupSubPageContentAnimations();
        setupTabs();
        setupDecorativeRectAnimations();
        setupLottieScrollTrigger();
        setupHistorySectionAnimation();
        setupPartnersSectionAnimation();
        setupHeroParallax();

        if (window.THREE) {
            setupHeroColorSwitcher(window.THREE);
        }

        setupHeroScrollSnap();
        setupSubPageScrollIconAnimation();
        setupScrollToTopButton();

        gsap.delayedCall(0.5, () => {
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh(true);
            }
            isResizing = false;
            const subHeroContentOnResize = document.querySelector(".sub-hero-content");
            if (subHeroContentOnResize) {
                gsap.set(subHeroContentOnResize, { autoAlpha: 1 });
                animateHeroText();
            }
            if (winhubObject) {
                gsap.set(winhubObject.rotation, {x: degToRad(0), y: degToRad(90), z: degToRad(0)});
            }
        });
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    setupScrollRestoration();
    disableScrollInteraction(); // 페이지 로드 시 스크롤 비활성화
    splineIntroPlayed = false;
    originalWinhubState = null;
    cachedWindowWidth = window.innerWidth;

    try {
        await loadCommonUI();
        await initializeSubpage();
    } catch (error) {
        hideLoaderOnError();
        enableScrollInteraction(); // 에러 발생 시 스크롤 활성화
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleSubPageResize, 250);
    });
});

window.addEventListener('load', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh(true);
        }
    }, 150);

});
