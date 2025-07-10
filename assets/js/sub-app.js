// assets/js/sub-app.js

import { Application as SplineRuntimeApp } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';
import * as THREE_MOD from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
window.THREE = THREE_MOD;

import { ScrollToPlugin } from "https://esm.sh/gsap/ScrollToPlugin";
import { SplitText } from "https://esm.sh/gsap/SplitText";

if (typeof gsap !== 'undefined') {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollToPlugin, SplitText, ScrollTrigger);
} else console.error("SUB-APP: GSAP core not loaded, cannot register plugins.");

import {
    setupScrollRestoration,
    degToRad,
    responsiveY,
    runLoaderSequence,
    hideLoaderOnError,
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
let splineIntroPlayed = false;
let gnbHeight = 0;
let isSnapping = false;
let isResizing = false;
let cachedWindowWidth = window.innerWidth;
let originalWinhubState = null;

const HERO_AREA_BACKGROUND_COLOR = "#292c35";
const pageColorConfigs = {
    "default": { bodyBackgroundColorFallback: HERO_AREA_BACKGROUND_COLOR, sphereColor: new THREE.Color(0xffffff), textColor: "#ffffff" },
    "about.html": { bodyBackgroundColorFallback: "#1f7277", sphereColor: new THREE.Color(0xeaf2f8), textColor: "#fdfefe" },
    "works.html": { bodyBackgroundColorFallback: "#1f3477", sphereColor: new THREE.Color(0xaed6f1), textColor: "#ecf0f1" },
    "contact.html": { bodyBackgroundColorFallback: "#491e9b", sphereColor: new THREE.Color(0xaed6f1), textColor: "#ecf0f1" },
};
const scrolledPastHeroColors = { 
    sphereColor: new THREE.Color(0x999999),
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
    return pageColorConfigs[pathname] || pageColorConfigs["default"];
}
const currentPageConfig = getCurrentPageConfig();


/**
 * Sets up animations and parallax effects for decorative rectangles in the Mission section.
 */
function setupDecorativeRectAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("GSAP or ScrollTrigger not loaded for decorative animations.");
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

/**
 * [REVISED] Sets up ScrollTrigger to control the Lottie animation player.
 * The animation now loops and restarts from the beginning when scrolled into view.
 */
function setupLottieScrollTrigger() {
    const lottiePlayer = document.querySelector("#overview-lottie");
    if (!lottiePlayer || typeof ScrollTrigger === 'undefined') {
        return;
    }

    // Ensure the player is set to loop
    lottiePlayer.loop = true;

    const st = ScrollTrigger.create({
        trigger: lottiePlayer.parentElement, // Trigger based on the parent container for better accuracy
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
            lottiePlayer.pause(); // Pause when it leaves the screen to save resources
        },
        onLeaveBack: () => {
            lottiePlayer.pause();
        },
        enabled: false // Initially disabled until the player is ready
    });

    // Enable the scroll trigger once the Lottie player is ready
    lottiePlayer.addEventListener('ready', () => {
        lottiePlayer.stop(); // Stop any autoplay initially
        if (st) {
            st.enable();
        }
    });
}


/**
 * [REVISED] Sets up scroll animations for the new timeline entries.
 * Entries slide in from the sides.
 */
function setupHistoryTimelineAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const timelineEntries = gsap.utils.toArray('.timeline-entry');
    if (!timelineEntries.length) return;

    timelineEntries.forEach(entry => {
        // Determine animation direction based on class
        const xFrom = entry.classList.contains('left-entry') ? -100 : 100;
        
        gsap.set(entry, { autoAlpha: 0, x: xFrom, y: 30 }); // Set initial state
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


/**
 * [REVISED] Integrated function to set up animations for the History section.
 */
function setupHistorySectionAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    const historySectionWrapper = document.querySelector("#history-section .section-content-wrapper");
    const historyTitle = historySectionWrapper ? historySectionWrapper.querySelector('.section-title') : null;

    if (historyTitle) {
        gsap.set(historyTitle, { opacity: 0, y: 50 }); // Set initial state for title
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

    setupHistoryTimelineAnimation(); // Call the new timeline animation function
}


// --- Animation & Setup Functions (Existing functions) ---
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
function switchColors(isScrolledPast) {
    const heroDependentElements = getHeroDependentElements();
    const otherContentTextElements = getOtherContentTextElements();

    const duration = 0.5;

    if (isScrolledPast) {
        subpageBodyElement.classList.add('scrolled-past-hero-colors');
    } else {
        subpageBodyElement.classList.remove('scrolled-past-hero-colors');
    }
    
    const targetSphereColors = isScrolledPast ? scrolledPastHeroColors.sphereColor : currentPageConfig.sphereColor;
    if (subPageBackgroundSphere) {
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
function setupHeroColorSwitcher() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !subpageBodyElement || !heroSection) return;

    const existingTrigger = ScrollTrigger.getById("heroColorSwitcher");
    if (existingTrigger) existingTrigger.kill();
    
    ScrollTrigger.create({
        id: "heroColorSwitcher",
        trigger: heroSection,
        start: "bottom 80%",
        toggleActions: "play none none reverse",
        onEnter: () => switchColors(true),
        onLeaveBack: () => switchColors(false),
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
    const sections = gsap.utils.toArray(".subpage-section:not(#sub-hero):not(#history-section)");

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

// --- Main Initialization ---
async function initializeSubpage() {
    initialPageVisualSetup();
    
    const loaderPromise = runLoaderSequence('.subpage-container');
    
    const splineLoadPromise = loadSplineScene("spline-canvas-subpage", "https://prod.spline.design/0FDfaGjmdgz0JYwR/scene.splinecode")
        .then(app => {
            subpageSplineApp = app;
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
        })
        .catch(error => {
            console.error("SUB-APP: Error loading subpage Spline scene:", error);
            const splineContainer = document.getElementById("threejs-object-container");
            if (splineContainer) gsap.set(splineContainer, { display: 'none' });
        });

    if (typeof THREE !== 'undefined' && subpageBodyElement) {
        subPageBackgroundSphere = new InteractiveBackgroundSphere('fullscreen-threejs-bg', {
            wireframeColor: currentPageConfig.sphereColor.clone(),
            pointsColor: currentPageConfig.sphereColor.clone(),
        });
        if (subPageBackgroundSphere.init) subPageBackgroundSphere.init();
    }
   
    await Promise.all([loaderPromise, splineLoadPromise]);

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
        gsap.to(subHeroContent, { autoAlpha: 1, duration: 0.1, onComplete: () => {
            animateHeroText().then(() => {
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
            });
        }});
    }

    if (subPageBackgroundSphere && subPageBackgroundSphere.introAnimate) {
        subPageBackgroundSphere.introAnimate();
    }

    setupSubPageContentAnimations();
    setupDecorativeRectAnimations();
    setupLottieScrollTrigger();
    setupHistorySectionAnimation();
    setupHeroParallax(); 
    setupHeroColorSwitcher();
    setupHeroScrollSnap();
    setupTabs();
    setupScrollToTopButton();
    setupSubPageScrollIconAnimation();

    window.scrollTo(0, 0);
    ScrollTrigger.refresh(true);
    if(subpageBodyElement) subpageBodyElement.style.overflow = 'auto';
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
        setupHeroParallax(); 
        setupHeroColorSwitcher();
        setupHeroScrollSnap(); 
        setupSubPageScrollIconAnimation();
        setupScrollToTopButton();

        gsap.delayedCall(0.5, () => {
            ScrollTrigger.refresh(true);
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
    splineIntroPlayed = false;
    originalWinhubState = null;
    cachedWindowWidth = window.innerWidth;

    try {
        await loadCommonUI();
        await initializeSubpage();
    } catch (error) {
        console.error("SUB-APP: Initialization failed:", error);
        hideLoaderOnError();
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
