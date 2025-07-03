// assets/js/main-app.js

// Spline Runtime, THREE.js, GSAP Plugins
// import { Application as SplineRuntimeApp } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';
import * as THREE_MOD from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
window.THREE = THREE_MOD;

import { Draggable } from "https://esm.sh/gsap/Draggable";
import { SplitText } from "https://esm.sh/gsap/SplitText";
import { MorphSVGPlugin } from "https://esm.sh/gsap/MorphSVGPlugin";

import { worksData } from './works-data.js';

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(Draggable, SplitText, MorphSVGPlugin);
}

// Imports from common-utils
import {
    setupScrollRestoration,
    degToRad,
    responsiveScale,
    responsiveX,
    responsiveY,
    runLoaderSequence, 
    hideLoaderOnError,
    buildUrl,
    InteractiveBackgroundSphere,
    loadSplineScene,
    killAllScrollTriggers,
    loadCommonUI
} from './common-utils.js';

// --- Global Variables for Main Page ---
let mainSplineApp = null;
let winhub = null, cable = null, splineTimelines = [];
let splitComName, splitSubTitles = [], splitHeadlineChars = [];
let mainPageBackgroundSphere = null;
let initialSetupDone = false;
let headlineCharsAnim = null;
let heroHeadlineTriggerEnabled = false;

// --- Scroll Prevention Variables ---
const SCROLL_PREVENTION_OPTIONS = { passive: false };
let isScrollCurrentlyDisabled = false;
let wasNormalizeScrollActive = false;

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize"
    });
}

// --- Configuration Variables ---
// ▼▼▼▼▼ 수정된 부분 ▼▼▼▼▼
const getScaleConfig = (isDesktopView) => {
    const screenWidth = window.innerWidth;
    if (!isDesktopView) { // Mobile (<= 767px)
        return { hero: 300, part1: 400, part2: 400, part3: 400 };
    }
    // Desktop views (> 767px)
    if (screenWidth > 2200) { // Large Desktop
        // 매우 넓은 화면에서는 오브젝트가 너무 커지지 않도록 기본 스케일 값을 줄입니다.
        return { hero: 115, part1: 170, part2: 170, part3: 170 };
    }
    // Standard Desktop
    return { hero: 140, part1: 200, part2: 200, part3: 200 };
};

const barShapesConfig = { initial: "M0 5 L0 5 L0 5 L0 5 Z", part1Enter: "M0,5 Q15,0 30,4 Q50,7 70,4 Q85,0 100,5 V5 Q85,10 70,6 Q50,3 30,6 Q15,10 0,5 Z", part2Enter: "M0,5 C20,-5 40,15 50,5 C60,-5 80,15 100,5 V5 C80,0 60,10 50,5 C40,0 20,10 0,5 Z", part3Enter: "M0,5 Q20,10 40,5 Q60,0 80,5 Q100,10 100,5 V5 Q80,0 60,5 Q40,10 20,5 Q0,0 0,5 Z", full: "M0,0 H100 V10 H0 Z" };

const getTargetWinhubX = (isMobileView) => {
    if (isMobileView) {
        return responsiveX(70);
    }
    const screenWidth = window.innerWidth;
    if (screenWidth > 2200) { // Large Desktop
        // 매우 넓은 화면에서 오브젝트가 너무 오른쪽으로 치우치지 않도록 X 값을 조정합니다.
        return responsiveX(58);
    }
    // Standard Desktop
    return responsiveX(65);
};
// ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲

const getTargetWinhubY = (isMobileView) => isMobileView ? responsiveY(-10) : 0;
const WINHUB_INTRO_END_Z = 0;
const partBackgroundColors = { hero: "#410b7a", part1: "#0b2c7a", part2: "#0b7a48", part3: "#7a063c" };

// --- Scroll Prevention Functions ---
function preventScroll(event) {
    if (isScrollCurrentlyDisabled) event.preventDefault();
}
function preventKeyboardScroll(event) {
    if (isScrollCurrentlyDisabled && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.code)) {
        event.preventDefault();
    }
}
function disableScrollInteraction() {
    if (isScrollCurrentlyDisabled) return;
    isScrollCurrentlyDisabled = true;
    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', preventScroll, SCROLL_PREVENTION_OPTIONS);
    window.addEventListener('touchmove', preventScroll, SCROLL_PREVENTION_OPTIONS);
    window.addEventListener('keydown', preventKeyboardScroll, SCROLL_PREVENTION_OPTIONS);
    if (typeof ScrollTrigger !== 'undefined') {
        const currentNormalizeConfig = ScrollTrigger.normalizeScroll();
        wasNormalizeScrollActive = !!currentNormalizeConfig;
        if (wasNormalizeScrollActive) ScrollTrigger.normalizeScroll(false);
        ScrollTrigger.disable(false, true);
    }
}
function enableScrollInteraction() {
    if (!isScrollCurrentlyDisabled) return;
    isScrollCurrentlyDisabled = false;
    document.body.style.overflow = 'auto';
    window.removeEventListener('wheel', preventScroll, SCROLL_PREVENTION_OPTIONS);
    window.removeEventListener('touchmove', preventScroll, SCROLL_PREVENTION_OPTIONS);
    window.removeEventListener('keydown', preventKeyboardScroll, SCROLL_PREVENTION_OPTIONS);
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.normalizeScroll(true);
        ScrollTrigger.enable();
    }
}

// --- Animation Functions ---
function playHeadlineCharsAnimation(animateIn) {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') return;

    const headlineDivs = document.querySelectorAll(".headline div");
    if (splitHeadlineChars.length !== headlineDivs.length ||
        (splitHeadlineChars.length > 0 && (!splitHeadlineChars[0] || !splitHeadlineChars[0].chars || !splitHeadlineChars[0].chars.length))) {
        splitHeadlineChars.forEach(st => st?.revert());
        splitHeadlineChars = [];
        headlineDivs.forEach((divElement) => {
            gsap.set(divElement, { autoAlpha: 1, overflow: 'hidden' });
            try {
                const lineSplit = new SplitText(divElement, { type: "chars", charsClass: "headline-char" });
                if (lineSplit.chars && lineSplit.chars.length > 0) {
                    splitHeadlineChars.push(lineSplit);
                }
            } catch (e) {
                console.error("Error re-splitting headline chars in playHeadlineCharsAnimation:", e);
                gsap.set(divElement, { autoAlpha: 1 });
            }
        });
    }

    if (splitHeadlineChars.length === 0 && headlineDivs.length > 0) {
        headlineDivs.forEach(div => gsap.set(div, { autoAlpha: animateIn ? 1 : 0, xPercent: 0}));
        gsap.set(".headline div em", {color: animateIn ? "#FFFF00" : ""});
        return;
    }
    if (splitHeadlineChars.length === 0) return;

    if (headlineCharsAnim && headlineCharsAnim.isActive()) {
        headlineCharsAnim.kill();
    }
    headlineCharsAnim = gsap.timeline();

    const emElements = document.querySelectorAll(".headline div em");

    if (animateIn) {
        splitHeadlineChars.forEach(lineSplit => {
            if (lineSplit.chars && lineSplit.chars.length > 0) {
                gsap.set(lineSplit.chars, { xPercent: 100, autoAlpha: 0 });
            }
        });
        if (emElements.length > 0) {
             gsap.set(emElements, {clearProps: "color"});
        }

        splitHeadlineChars.forEach((lineSplit, lineIndex) => {
            if (lineSplit.chars && lineSplit.chars.length > 0) {
                headlineCharsAnim.to(lineSplit.chars,
                    { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.09, ease: "circ.out" },
                    lineIndex * 0.08
                );
            }
        });
        if (emElements.length > 0) {
            headlineCharsAnim.to(emElements, { color: "#FFFF00", duration: 0.25, stagger: 0.04, ease: "power1.inOut" }, ">-0.25");
        }
    } else {
        splitHeadlineChars.slice().reverse().forEach((lineSplit, lineIndex) => {
            if (lineSplit.chars && lineSplit.chars.length > 0) {
                headlineCharsAnim.to(lineSplit.chars,
                    { autoAlpha: 0, xPercent: -100, duration: 0.2, stagger: { each: 0.008, from: "start" }, ease: "power1.in" },
                    lineIndex * 0.03
                );
            }
        });
        if (emElements.length > 0) {
            headlineCharsAnim.set(emElements, { clearProps: "color" }, 0);
        }
    }
}

function setupHeroHeadlineScrollTrigger() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const heroSection = document.querySelector("#hero");
    if (!heroSection) return;

    ScrollTrigger.create({
        id: 'heroHeadlineScrollTrigger',
        trigger: heroSection,
        start: "top 60%",
        end: "bottom 40%",
        invalidateOnRefresh: true,
        onEnter: () => { if (heroHeadlineTriggerEnabled) playHeadlineCharsAnimation(true); },
        onLeave: () => { if (heroHeadlineTriggerEnabled) playHeadlineCharsAnimation(false); },
        onEnterBack: () => { if (heroHeadlineTriggerEnabled) playHeadlineCharsAnimation(true); },
        onLeaveBack: () => { if (heroHeadlineTriggerEnabled) playHeadlineCharsAnimation(false); },
    });
}

function setupSubTitleAnimation() {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const subTitleElements = document.querySelectorAll(".sub-title");
    if (subTitleElements.length === 0) return;
    splitSubTitles.forEach(splitInstance => splitInstance?.revert()); splitSubTitles = [];
    subTitleElements.forEach((element, index) => {
        const isOutroTitle = element.closest('#part3');
        const textContentForId = element.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const triggerIdSuffix = textContentForId || `untitled-${index}`;
        const triggerId = isOutroTitle ? `subTitleAppearTrigger-outro-${index}` : `subTitleAppearTrigger-${triggerIdSuffix}-${index}`;
        let splitInstance;
        try {
            splitInstance = new SplitText(element, { type: "chars" }); splitSubTitles.push(splitInstance);
            gsap.set(element, { autoAlpha: 1 });
            if (isOutroTitle) {
                if (splitInstance.chars && splitInstance.chars.length > 0) {
                    const part3Info = element.closest('.part3-info'); if (part3Info) gsap.set(part3Info, { autoAlpha: 1 });
                    ScrollTrigger.create({ id: triggerId, trigger: element, start: "top 75%", toggleActions: "play none none reverse", invalidateOnRefresh: true, markers: false,
                        onEnter: () => gsap.fromTo(splitInstance.chars, { opacity: 0, y: -60 }, { opacity: 1, y: 0, color: '', duration: 0.6, ease: "bounce.out", stagger: 0.08, overwrite: true }),
                        onLeaveBack: () => gsap.to(splitInstance.chars, { opacity: 0, y: -60, duration: 0.3, ease: "power1.in", stagger: { each: 0.04, from: "start" } }),
                    });
                } else gsap.set(element, { autoAlpha: 1, y: 0 });
            } else {
                ScrollTrigger.create({ id: triggerId, trigger: element, start: "top 85%", toggleActions: "restart reverse restart reverse", invalidateOnRefresh: true,
                    onEnter: () => gsap.fromTo(splitInstance.chars, { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.08, overwrite: true }),
                    onLeave: () => gsap.to(splitInstance.chars, { opacity: 0, y: 70, duration: 0.3, ease: "power1.in", stagger: { each: 0.04, from: "end" }, overwrite: true }),
                    onEnterBack: () => gsap.fromTo(splitInstance.chars, { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.08, overwrite: true }),
                    onLeaveBack: () => gsap.to(splitInstance.chars, { opacity: 0, y: -60, duration: 0.3, ease: "power1.in", stagger: { each: 0.04, from: "start" }, overwrite: true })
                });
            }
        } catch (e) { console.error(`Error with SplitText/ScrollTrigger for .sub-title (${triggerId}):`, element, e); gsap.set(element, { autoAlpha: 1, y: 0 }); }
    });
 }

function setupWorksHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const pinTargetElement = document.querySelector("#part2 .part2-info");
    const list = document.querySelector("#part2 .works-list");
    if (!pinTargetElement || !list) return;
    let worksTitleTriggerId = "subTitleAppearTrigger-works-0";
    const worksSubTitleElement = document.querySelector("#part2 .sub-title");
    if (worksSubTitleElement) {
        const textContentForId = worksSubTitleElement.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const stInstance = ScrollTrigger.getAll().find(st => st.vars.trigger === worksSubTitleElement && st.vars.id.startsWith(`subTitleAppearTrigger-${textContentForId}`));
        if (stInstance) worksTitleTriggerId = stInstance.vars.id;
    }
    const getXAmount = () => (!list || !pinTargetElement || pinTargetElement.offsetWidth === 0) ? 0 : -(list.scrollWidth - pinTargetElement.offsetWidth + 40);
    const getEndAmount = () => (!list || !pinTargetElement || pinTargetElement.offsetWidth === 0) ? "+=0" : "+=" + (list.scrollWidth - pinTargetElement.offsetWidth);
    gsap.to(list, { x: getXAmount, ease: "none", scrollTrigger: {
            id: 'worksHorizontalScrollTrigger', trigger: pinTargetElement, pin: pinTargetElement, pinType: 'transform', start: "center center", pinSpacing: true, end: getEndAmount, anticipatePin: 1, scrub: 1.2, invalidateOnRefresh: true,
            onRefresh: (self) => { if (list) void list.offsetWidth; if (pinTargetElement) void pinTargetElement.offsetHeight; },
            onEnter: () => { const st = ScrollTrigger.getById(worksTitleTriggerId); if (st && st.enabled) st.disable(false); },
            onLeave: () => { const st = ScrollTrigger.getById(worksTitleTriggerId); if (st && !st.enabled) st.enable(false); },
            onEnterBack: () => { const st = ScrollTrigger.getById(worksTitleTriggerId); if (st && st.enabled) st.disable(false); },
            onLeaveBack: () => { const st = ScrollTrigger.getById(worksTitleTriggerId); if (st && !st.enabled) st.enable(false); }
    }});
 }

function setupWorkItemAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const workItems = gsap.utils.toArray("#part2 .work-item");
    const horizontalScrollTrigger = ScrollTrigger.getById('worksHorizontalScrollTrigger');

    if (!horizontalScrollTrigger || workItems.length === 0) {
        console.warn("setupWorkItemAnimations: Could not find worksHorizontalScrollTrigger. Animations might not work as expected.");
        return;
    }

    workItems.forEach((item, index) => {
        gsap.set(item, { autoAlpha: 0, y: 75, scale: 0.8, rotationZ: -10 });

        ScrollTrigger.create({
            id: `work-item-anim-${index}`,
            trigger: item,
            containerAnimation: horizontalScrollTrigger.animation,
            start: "left 95%",
            toggleActions: "restart pause resume reverse",
            onEnter: self => {
                gsap.to(self.trigger, {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    rotationZ: 0,
                    duration: 0.6,
                    ease: "back.out(1.4)",
                    overwrite: true
                });
            },
            onLeaveBack: self => {
                gsap.to(self.trigger, {
                    autoAlpha: 0,
                    y: 75,
                    scale: 0.8,
                    rotationZ: -10,
                    duration: 0.4,
                    ease: "power1.in",
                    overwrite: true
                });
            }
        });
    });
}

function setupHeaderLogoScrollAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const headerLogo = document.querySelector("#header-placeholder .com-name-logo");
    if (!headerLogo) {
        return;
    }
    gsap.set(headerLogo, { autoAlpha: 0 });
    ScrollTrigger.create({
        id: 'headerLogoVisibilityTrigger',
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        invalidateOnRefresh: true,
        onEnter: () => { gsap.to(headerLogo, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }); },
        onLeave: () => { gsap.to(headerLogo, { autoAlpha: 1, duration: 0.2, ease: "power1.in" }); },
        onEnterBack: () => { gsap.to(headerLogo, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }); },
        onLeaveBack: () => { gsap.to(headerLogo, { autoAlpha: 0, duration: 0.2, ease: "power1.out" });}
    });
 }

function setupMainPageBackgroundChangeAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.set(document.body, { backgroundColor: partBackgroundColors.hero });
    ['part1', 'part2', 'part3'].forEach(partId => {
        const sectionElement = document.getElementById(partId); const targetColor = partBackgroundColors[partId];
        if (sectionElement && targetColor) {
            ScrollTrigger.create({ id: `mainPageBackgroundChangeTrigger-${partId}`, trigger: sectionElement, start: "top center+=20%", end: "bottom center-=20%", invalidateOnRefresh: true,
                onEnter: () => gsap.to(document.body, { backgroundColor: targetColor, duration: 0.8, ease: "sine.inOut" }),
                onEnterBack: () => gsap.to(document.body, { backgroundColor: targetColor, duration: 0.8, ease: "sine.inOut" }),
                onLeaveBack: () => { const prevColorKey = partId === 'part1' ? 'hero' : (partId === 'part2' ? 'part1' : 'part2'); gsap.to(document.body, { backgroundColor: partBackgroundColors[prevColorKey], duration: 0.8, ease: "sine.inOut" }); }
            });
        }
    });
 }

function setupSplineScrollAnimations(winhubObj, cableObj, isDesktopView) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    splineTimelines.forEach(tl => tl.kill()); splineTimelines = []; const currentScaleConfig = getScaleConfig(isDesktopView);
    const isMobileView = !isDesktopView;

    // Hero Timeline
    const heroTimeline = gsap.timeline({ scrollTrigger: { id: 'splineScrollTrigger-hero', trigger: "#hero", start: "top 10%", end: "bottom bottom", scrub: true, invalidateOnRefresh: true, onEnter: () => cableObj && (cableObj.visible = false), onLeaveBack: () => cableObj && (cableObj.visible = false), onRefresh: () => { if (ScrollTrigger.isInViewport("#hero") && (!document.querySelector("#part1") || !ScrollTrigger.isInViewport("#part1"))) cableObj && (cableObj.visible = false); }}});
    heroTimeline.to(winhubObj.position, {
        x: getTargetWinhubX(isMobileView),
        y: getTargetWinhubY(isMobileView), 
        z: WINHUB_INTRO_END_Z
    }, 0)
    .to(winhubObj.rotation, { x: degToRad(0), y: degToRad(90), z: degToRad(0) }, 0)
    .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.hero), y: responsiveScale(currentScaleConfig.hero), z: responsiveScale(currentScaleConfig.hero) }, 0);
    splineTimelines.push(heroTimeline);

    // Part 1 Timeline
    if (document.getElementById('part1')) {
        const part1Timeline = gsap.timeline({ scrollTrigger: { id: 'splineScrollTrigger-part1', trigger: "#part1", start: "top 70%", end: "center bottom", scrub: 2, invalidateOnRefresh: true, onEnter: () => cableObj && (cableObj.visible = true), onEnterBack: () => cableObj && (cableObj.visible = true), onLeaveBack: () => cableObj && (cableObj.visible = false) }});
        const part1Position = isMobileView ?
            { x: responsiveX(-20), y: responsiveY(30), z: responsiveX(-10) } : 
            { x: responsiveX(-93.75), y: responsiveY(37.04), z: responsiveX(-31.25) }; 

        part1Timeline.to(winhubObj.position, part1Position, 0)
            .to(winhubObj.rotation, { x: degToRad(80.5), y: degToRad(60), z: degToRad(-65) }, 0)
            .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.part1), y: responsiveScale(currentScaleConfig.part1), z: responsiveScale(currentScaleConfig.part1) }, 0);
        splineTimelines.push(part1Timeline);
    }

    // Part 2 Timeline
    if (document.getElementById('part2')) {
        const part2Timeline = gsap.timeline({ scrollTrigger: { id: "part2SplineScrollTrigger", trigger: "#part2", start: "top 85%", end: "top 30%", scrub: 2, invalidateOnRefresh: true, onEnter: () => cableObj && (cableObj.visible = true), onEnterBack: () => cableObj && (cableObj.visible = true) }});
        const part2Position = isMobileView ?
            { x: responsiveX(20), y: responsiveY(15), z: responsiveX(-5) } : 
            { x: responsiveX(50), y: responsiveY(10), z: responsiveX(-20) }; 

        part2Timeline.to(winhubObj.position, part2Position, 0)
            .to(winhubObj.rotation, { x: degToRad(40), y: degToRad(60), z: degToRad(-60) }, 0)
            .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.part2 * 0.8), y: responsiveScale(currentScaleConfig.part2 * 0.8), z: responsiveScale(currentScaleConfig.part2 * 0.8) }, 0);
        splineTimelines.push(part2Timeline);
    }

    // Part 3 Timeline
    if (document.getElementById('part3')) {
        const part3Timeline = gsap.timeline({ scrollTrigger: { id: 'splineScrollTrigger-part3', trigger: "#part3", start: "top 30%", end: "center bottom", scrub: 2, invalidateOnRefresh: true, onEnter: () => cableObj && (cableObj.visible = true) }});
        const part3Position = isMobileView ?
            { x: responsiveX(-30), y: responsiveY(70), z: 0 } : 
            { x: responsiveX(-61.67), y: responsiveY(80.11), z: 0 };

        part3Timeline.to(winhubObj.position, part3Position, 0)
            .to(winhubObj.rotation, { x: degToRad(90), y: degToRad(-25), z: degToRad(-20) }, 0)
            .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.part3), y: responsiveScale(currentScaleConfig.part3), z: responsiveScale(currentScaleConfig.part3) }, 0);
        splineTimelines.push(part3Timeline);
    }
 }

function setupBarAnimations() {
    if (typeof gsap === 'undefined' || typeof MorphSVGPlugin === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const barElement = document.getElementById("barElementPath"); if (!barElement) return; gsap.set(barElement, { morphSVG: barShapesConfig.initial });
    const sections = [ { id: "hero", shape: barShapesConfig.initial, nextShape: barShapesConfig.part1Enter, color: "#FFD700" }, { id: "part1", shape: barShapesConfig.part1Enter, nextShape: barShapesConfig.part2Enter, color: "#87CEEB" }, { id: "part2", shape: barShapesConfig.part2Enter, nextShape: barShapesConfig.part3Enter, color: "#90EE90" }, { id: "part3", shape: barShapesConfig.part3Enter, nextShape: barShapesConfig.full, color: "#FFB6C1" } ];
    sections.forEach((section, index) => { const triggerElement = document.getElementById(section.id); if (!triggerElement) return;
        ScrollTrigger.create({ id: `barMorphTrigger-${section.id}`, trigger: triggerElement, start: "top 10%", end: "bottom top", invalidateOnRefresh: true,
            onEnter: () => gsap.to(barElement, { morphSVG: section.shape, duration: 0.7, ease: "sine.inOut", attr: { fill: section.color } }),
            onEnterBack: () => gsap.to(barElement, { morphSVG: section.shape, duration: 0.7, ease: "sine.inOut", attr: { fill: section.color } }),
            onLeaveBack: () => { if (index > 0) gsap.to(barElement, { morphSVG: sections[index - 1].shape, duration: 0.7, ease: "sine.inOut", attr: { fill: sections[index - 1].color } }); else gsap.to(barElement, { morphSVG: barShapesConfig.initial, duration: 0.7, ease: "sine.inOut", attr: { fill: sections[0].color } }); }
        });
    });
 }

function setupAdvantageCardAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const advantageCards = gsap.utils.toArray("#part1 .advantage-card"); const integratedCard = document.querySelector("#part1 .integrated-value-card");
    advantageCards.forEach((card, index) => { gsap.set(card, { autoAlpha: 0, y: 50 });
        ScrollTrigger.create({ id: `advantageCardTrigger-${index}`, trigger: card, start: "top 85%", end: "bottom 15%", invalidateOnRefresh: true,
            onEnter: () => gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", delay: index * 0.1, overwrite: true }),
            onLeave: () => gsap.to(card, { autoAlpha: 0, y: 50, duration: 0.3, ease: "power1.in", overwrite: true }),
            onEnterBack: () => gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", delay: index * 0.1, overwrite: true }),
            onLeaveBack: () => gsap.to(card, { autoAlpha: 0, y: 50, duration: 0.3, ease: "power1.in", overwrite: true })
        });
    });
    if (integratedCard) { gsap.set(integratedCard, { autoAlpha: 0, y: 50 });
        ScrollTrigger.create({ id: 'integratedCardTrigger', trigger: integratedCard, start: "top 85%", end: "bottom 15%", invalidateOnRefresh: true,
            onEnter: () => gsap.to(integratedCard, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", delay: advantageCards.length * 0.1, overwrite: true }),
            onLeave: () => gsap.to(integratedCard, { autoAlpha: 0, y: 50, duration: 0.3, ease: "power1.in", overwrite: true }),
            onEnterBack: () => gsap.to(integratedCard, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", delay: advantageCards.length * 0.1, overwrite: true }),
            onLeaveBack: () => gsap.to(integratedCard, { autoAlpha: 0, y: 50, duration: 0.3, ease: "power1.in", overwrite: true })
        });
    }
 }

function setupOutroContentAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const outroContentContainer = document.querySelector("#part3 .outro-content"); if (!outroContentContainer) return;
    const part3Info = outroContentContainer.closest('.part3-info'); if (part3Info) gsap.set(part3Info, { autoAlpha: 1 });
    gsap.set(outroContentContainer, { autoAlpha: 1 });
    const elementsToAnimate = gsap.utils.toArray(outroContentContainer.children); if (elementsToAnimate.length === 0) return;
    gsap.set(elementsToAnimate, { autoAlpha: 0, y: 40 });
    ScrollTrigger.create({ id: `outroContentAllTrigger`, trigger: outroContentContainer, start: "top 80%", invalidateOnRefresh: true, toggleActions: "play none none reverse", markers: false,
        onEnter: () => gsap.to(elementsToAnimate, { autoAlpha: 1, y: 0, color: '', duration: 0.5, ease: "power2.out", stagger: 0.15 }),
        onLeaveBack: () => gsap.to(elementsToAnimate, { autoAlpha: 0, y: 40, duration: 0.3, ease: "power1.in" }),
    });
}

function setupScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn"); if (!scrollToTopBtn) return;
    window.addEventListener("scroll", () => { if (window.scrollY > window.innerHeight / 2) { if (!scrollToTopBtn.classList.contains("show")) scrollToTopBtn.classList.add("show"); } else { if (scrollToTopBtn.classList.contains("show")) scrollToTopBtn.classList.remove("show"); }});
    scrollToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
 }

function setupScrollIconAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const scrollIcon = document.querySelector(".scroll-icon");
    if (!scrollIcon) return;
    const existingTrigger = ScrollTrigger.getById('scrollIconVisibilityTrigger');
    if (existingTrigger) {
        existingTrigger.kill();
    }
    ScrollTrigger.create({
        id: 'scrollIconVisibilityTrigger',
        trigger: document.body,
        start: 1,
        end: "max",
        invalidateOnRefresh: true,
        onEnter: () => gsap.to(scrollIcon, { autoAlpha: 0, duration: 0.2 }),
        onLeaveBack: () => gsap.to(scrollIcon, { autoAlpha: 1, duration: 0.2 }),
    });
 }

function populateWorksList() {
    const worksListContainer = document.querySelector("#part2 .works-list");
    if (!worksListContainer) {
        console.error("populateWorksList: .works-list element not found.");
        return;
    }

    const numberOfRecentWorks = 7;
    const sortedWorks = [...worksData].sort((a, b) => {
        const dateA = parseInt(a.date.replace('.', ''), 10);
        const dateB = parseInt(b.date.replace('.', ''), 10);
        return dateB - dateA;
    });

    const recentWorks = sortedWorks.slice(0, numberOfRecentWorks);

    worksListContainer.innerHTML = '';
    recentWorks.forEach(work => {
        const listItem = document.createElement('li');
        listItem.classList.add('work-item');

        const link = document.createElement('a');
        link.href = buildUrl(`page/works_details/works-detail.html?id=${work.id}`); 
        link.setAttribute('aria-label', `View Project ${work.title}`);

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('work-item-thumbnail');
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = buildUrl(work.listImage);
        thumbnailImg.alt = `[프로젝트 ${work.title} 썸네일]`;
        thumbnailImg.onerror = function() {
            this.onerror = null;
            this.src = `https://placehold.co/600x450/cccccc/333333?text=Image+Not+Found`;
        };
        thumbnailDiv.appendChild(thumbnailImg);

        const captionDiv = document.createElement('div');
        captionDiv.classList.add('work-item-caption');
        const titleHeading = document.createElement('h3');
        titleHeading.textContent = work.title;
        const serviceParagraph = document.createElement('p');
        serviceParagraph.textContent = work.service.split('・')[0];
        captionDiv.appendChild(titleHeading);
        captionDiv.appendChild(serviceParagraph);

        link.appendChild(thumbnailDiv);
        link.appendChild(captionDiv);
        listItem.appendChild(link);

        worksListContainer.appendChild(listItem);
    });
}


// --- Main Sequence ---
async function runMainPageSequence() {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') {
        hideLoaderOnError();
        return;
    }

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.normalizeScroll(true);
    }
    
    const loaderPromise = runLoaderSequence('.part-container');
    
    const splineCanvas = document.getElementById("canvas3d");
    if (splineCanvas) gsap.set(splineCanvas, { autoAlpha: 0 });

    try {
        mainSplineApp = await loadSplineScene("canvas3d", "https://prod.spline.design/0FDfaGjmdgz0JYwR/scene.splinecode");
        if (mainSplineApp) {
            winhub = mainSplineApp.findObjectByName("Winhub");
            cable = mainSplineApp.findObjectByName("cable");
            if (winhub) winhub.visible = false;
            if (cable) cable.visible = false;
            if (!winhub || !cable) console.error("MAIN-APP: Missing critical Spline objects (Winhub or cable).");
        } else {
            console.error("MAIN-APP: Main Spline App could not be loaded.");
        }
    } catch (error) {
        console.error("MAIN-APP: Error during critical loading:", error);
    }

    await loaderPromise;

    disableScrollInteraction();

    const comNameElement = document.querySelector(".com-name-ani");
    const heroTextBlock = document.querySelector('.hero-text-block');

    if (!comNameElement || !heroTextBlock) {
        console.error("Missing critical hero text elements for intro animation.");
        hideLoaderOnError();
        enableScrollInteraction();
        return;
    }
    
    gsap.set(comNameElement, { autoAlpha: 0 });
    gsap.set(".headline", { autoAlpha: 0 });
    gsap.set(".headline div", { autoAlpha: 0 });
    
    const masterIntroTimeline = gsap.timeline({ onComplete: onMasterIntroComplete });
    const isMobileViewInitial = window.innerWidth <= 767;

    if (comNameElement.parentNode !== heroTextBlock) {
        heroTextBlock.prepend(comNameElement);
    }
    gsap.set(comNameElement, {
        position: 'absolute',
        top: 0,
        left: 0,
        transform: 'translateY(-100%)',
        autoAlpha: 1 
    });

    let finalPositions = [];
    let tempSplit;
    try {
        tempSplit = new SplitText(comNameElement, { type: 'chars' });
        if (tempSplit.chars) {
            finalPositions = tempSplit.chars.map(char => {
                const rect = char.getBoundingClientRect();
                return { x: rect.left, y: rect.top };
            });
        }
        tempSplit.revert();
    } catch (e) {
        console.error("Failed to split text for measurement:", e);
    }
    gsap.set(comNameElement, { autoAlpha: 0 });

    gsap.set(comNameElement, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        transform: 'none',
        autoAlpha: 1
    });
    try {
        splitComName = new SplitText(comNameElement, { type: "chars", position: "absolute" });
    } catch (e) {
        splitComName = null;
        console.error("Failed to split text for animation:", e);
    }

    if (splitComName && splitComName.chars && finalPositions.length === splitComName.chars.length) {
        masterIntroTimeline.from(splitComName.chars, {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(2)',
            stagger: 0.1
        });

        masterIntroTimeline.to(splitComName.chars, {
            duration: 1.2,
            x: (i, el) => finalPositions[i].x - el.getBoundingClientRect().left,
            y: (i, el) => finalPositions[i].y - el.getBoundingClientRect().top,
            ease: 'power3.inOut',
            stagger: 0.06
        }, "+=0.02");

        masterIntroTimeline.call(() => {
            if (splitComName) {
                splitComName.revert();
                splitComName = null; 
                gsap.set(comNameElement, {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'translateY(-100%)',
                    autoAlpha: 1 
                });
            }
        });
    } else { 
        masterIntroTimeline.to(comNameElement, { autoAlpha: 1, duration: 1 });
    }

    const headlineStartTime = "<+=0.02"; 
    masterIntroTimeline
        .set(".headline", { autoAlpha: 1, xPercent: -50, left: "50%" }, headlineStartTime)
        .to(".headline", { xPercent: 0, left: "0%", duration: .5, ease: "power3.inOut" })
        .addLabel("startHeadlineChars", ">-0.1");
    
    const headlineDivs = document.querySelectorAll(".headline div");
    if (headlineDivs.length > 0) {
        if (splitHeadlineChars.length !== headlineDivs.length || (splitHeadlineChars.length > 0 && (!splitHeadlineChars[0].chars || !splitHeadlineChars[0].chars.length))) {
            splitHeadlineChars.forEach(st => st?.revert());
            splitHeadlineChars = [];
            headlineDivs.forEach((divElement) => {
                gsap.set(divElement, { autoAlpha: 1, overflow: 'hidden' });
                try {
                    const lineSplit = new SplitText(divElement, { type: "chars", charsClass: "headline-char" });
                    if (lineSplit.chars && lineSplit.chars.length > 0) {
                        splitHeadlineChars.push(lineSplit);
                    }
                } catch (e) {
                    console.error("Error splitting headline chars in intro:", e);
                    gsap.set(divElement, { autoAlpha: 1 });
                }
            });
        }

        splitHeadlineChars.forEach((lineSplit, lineIndex) => {
            if (lineSplit.chars && lineSplit.chars.length > 0) {
                gsap.set(lineSplit.chars, { xPercent: 100, autoAlpha: 0 });
                masterIntroTimeline.to(lineSplit.chars,
                    { xPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: "circ.out" },
                    `startHeadlineChars+=${lineIndex * 0.48}`
                );
            }
        });
        const emElements = document.querySelectorAll(".headline div em");
        if (emElements.length > 0) {
            gsap.set(emElements, {clearProps: "color"});
            masterIntroTimeline.to(emElements, { color: "#FFFF00", duration: 0.3, stagger: 0.05, ease: "power1.inOut" }, ">-0.2");
        }
    }

    if (splineCanvas && winhub) {
        const currentScaleConfig = getScaleConfig(!isMobileViewInitial);
        masterIntroTimeline.to(splineCanvas, { autoAlpha: 1, duration: 1 }, "-=0.5").call(() => winhub.visible = true, null, "<")
            .fromTo(winhub.scale, { x: responsiveScale(currentScaleConfig.hero * 0.5), y: responsiveScale(currentScaleConfig.hero * 0.5), z: responsiveScale(currentScaleConfig.hero * 0.5) }, { x: responsiveScale(currentScaleConfig.hero), y: responsiveScale(currentScaleConfig.hero), z: responsiveScale(currentScaleConfig.hero), duration: 1.5, ease: "power3.out" }, "<+0.2")
            .fromTo(winhub.rotation, { x: degToRad(90), y: degToRad(-360), z: degToRad(5) }, { x: degToRad(0), y: degToRad(90), z: degToRad(0), duration: 1.5, ease: "power3.out" }, "<")
            .fromTo(winhub.position,
                { x: 0, y: 0, z: WINHUB_INTRO_END_Z }, 
                {
                    x: getTargetWinhubX(isMobileViewInitial),
                    y: getTargetWinhubY(isMobileViewInitial), 
                    z: WINHUB_INTRO_END_Z,
                    duration: 1.5,
                    ease: "power3.out"
                },
                "<");
    }
}

function onMasterIntroComplete() {
    enableScrollInteraction();
    if (typeof window.THREE !== 'undefined') {
        mainPageBackgroundSphere = new InteractiveBackgroundSphere('threejs-background-container', { sphereOffsetX: .1, sphereOffsetY: 0 });
        if (mainPageBackgroundSphere.valid && mainPageBackgroundSphere.init) mainPageBackgroundSphere.init().introAnimate();
    }
    if (!initialSetupDone) {
        setupResponsiveScrollTriggers();
        initialSetupDone = true;
    } else {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
    }
    heroHeadlineTriggerEnabled = true;
    const menuIcon = document.querySelector(".menu-icon");
    if (menuIcon) gsap.to(menuIcon, { duration: 0.8, autoAlpha: 1, ease: "power2.out", delay: 0.1 });
    const scrollIcon = document.querySelector(".scroll-icon");
    if (scrollIcon) gsap.to(scrollIcon, { duration: 0.8, autoAlpha: 1, ease: "power2.out", delay: 0.3 });
    window.scrollTo(0, 0);
}

function setupAllScrollTriggers(isDesktopView) {
    const elementsToClear = ["#part2 .part2-info", "#part2 .works-list", "#part2 .works-list-container"];
    elementsToClear.forEach(selector => { const el = document.querySelector(selector); if (el) gsap.set(el, { clearProps: "all" }); });
    gsap.set(document.body, { clearProps: "backgroundColor" });
    
    const comNameElement = document.querySelector(".com-name-ani");
    if (comNameElement) {
        comNameElement.classList.remove('scrolled');
        if (splitComName && splitComName.revert) {
            splitComName.revert();
            splitComName = null; 
        }
        gsap.set(comNameElement, {
            clearProps: "top,left,right,bottom,x,y,xPercent,yPercent,zIndex",
            autoAlpha: 1, 
            position: 'absolute',
            top: '0px',
            left: '0px',
            transform: 'translateY(-100%)'
        });
    }

    setupMainPageBackgroundChangeAnimations();
    if (mainSplineApp && winhub && cable) setupSplineScrollAnimations(winhub, cable, isDesktopView);
    setupBarAnimations();
    setupAdvantageCardAnimations();
    setupOutroContentAnimation();
    setupHeaderLogoScrollAnimation();
    setupHeroHeadlineScrollTrigger();
    setupSubTitleAnimation();
    setupWorksHorizontalScroll();
    setupWorkItemAnimations();
    setupScrollToTopButton();
    setupScrollIconAnimation();
    document.body.offsetHeight;
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
        ScrollTrigger.update();
    }
    if (initialSetupDone) heroHeadlineTriggerEnabled = true;
}

function setupResponsiveScrollTriggers() {
    if (typeof ScrollTrigger === 'undefined') return;
    ScrollTrigger.matchMedia({
        "(min-width: 768px)": function() {
            killAllScrollTriggers();
            heroHeadlineTriggerEnabled = false;
            splineTimelines.forEach(tl => tl.kill()); splineTimelines = [];
            splitSubTitles.forEach(st => st?.revert()); splitSubTitles = [];
            if (splitComName) { splitComName.revert(); splitComName = null; }
            splitHeadlineChars.forEach(st => st?.revert()); splitHeadlineChars = [];
            setupAllScrollTriggers(true);
            return function() { 
                killAllScrollTriggers(); 
                heroHeadlineTriggerEnabled = false; 
                splineTimelines.forEach(tl => tl.kill()); splineTimelines = []; 
                splitSubTitles.forEach(st => st?.revert()); splitSubTitles = []; 
                if (splitComName) { splitComName.revert(); splitComName = null; } 
                splitHeadlineChars.forEach(st => st?.revert()); splitHeadlineChars = []; 
            };
        },
        "(max-width: 767px)": function() {
            killAllScrollTriggers();
            heroHeadlineTriggerEnabled = false;
            splineTimelines.forEach(tl => tl.kill()); splineTimelines = [];
            splitSubTitles.forEach(st => st?.revert()); splitSubTitles = [];
            if (splitComName) { splitComName.revert(); splitComName = null; }
            splitHeadlineChars.forEach(st => st?.revert()); splitHeadlineChars = [];
            setupAllScrollTriggers(false);
            return function() { 
                killAllScrollTriggers(); 
                heroHeadlineTriggerEnabled = false; 
                splineTimelines.forEach(tl => tl.kill()); splineTimelines = []; 
                splitSubTitles.forEach(st => st?.revert()); splitSubTitles = []; 
                if (splitComName) { splitComName.revert(); splitComName = null; } 
                splitHeadlineChars.forEach(st => st?.revert()); splitHeadlineChars = []; 
            };
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    window.scrollTo(0, 0);

    setupScrollRestoration();
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.normalizeScroll(true);
    }
    try {
        await loadCommonUI();
        const headerLogoForEarlyHide = document.querySelector("#header-placeholder .com-name-logo");
        if (headerLogoForEarlyHide) gsap.set(headerLogoForEarlyHide, { autoAlpha: 0 });
        
        populateWorksList();
        
        runMainPageSequence().catch(error => {
            console.error("Error in runMainPageSequence:", error);
            hideLoaderOnError();
            enableScrollInteraction();
            window.scrollTo(0, 0);
            if (!initialSetupDone) {
                setupResponsiveScrollTriggers();
                initialSetupDone = true;
            } else {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(true);
            }
        });
    } catch (error) {
        console.error("Failed to load common UI or initialize its scripts:", error);
        hideLoaderOnError();
        enableScrollInteraction();
    }
});
