// assets/js/main-app.js

// GSAP 플러그인들은 정적으로 로드합니다.
import { Draggable } from "https://esm.sh/gsap/Draggable";
import { SplitText } from "https://esm.sh/gsap/SplitText";
import { MorphSVGPlugin } from "https://esm.sh/gsap/MorphSVGPlugin";
import { Observer } from "https://esm.sh/gsap/Observer";

import { worksData } from './works-data.js';

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(Draggable, SplitText, MorphSVGPlugin, Observer);
}

// common-utils.js에서 스크롤 제어 함수를 포함한 모든 유틸리티를 가져옵니다.
import {
    setupScrollRestoration,
    degToRad,
    responsiveScale,
    responsiveX,
    responsiveY,
    runLoaderSequence,
    hideLoaderOnError,
    buildUrl,
    loadCommonUI,
    killAllScrollTriggers,
    disableScrollInteraction,
    enableScrollInteraction
} from './common-utils.js';


// 모바일 브라우저의 동적 주소창에 대응하여 실제 뷰포트 높이를 계산하고 CSS 변수(--vh)를 설정합니다.
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
document.addEventListener('DOMContentLoaded', setViewportHeight);


// --- Global Variables for Main Page ---
let mainSplineApp = null;
let winhub = null, cable = null, splineTimelines = [];
let splitComName, splitSubTitles = [], splitHeadlineChars = [];
let mainPageBackgroundSphere = null;
let initialSetupDone = false;
let headlineCharsAnim = null;
let heroHeadlineTriggerEnabled = false;

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize"
    });
}

// --- Configuration Variables ---
const getScaleConfig = (isDesktopView) => ({ hero: isDesktopView ? 140 : 300, part1: isDesktopView ? 200 : 400, part2: isDesktopView ? 200 : 400, part3: isDesktopView ? 200 : 400 });
const getTargetWinhubX = (isMobileView) => isMobileView ? responsiveX(70) : responsiveX(65);
const getTargetWinhubY = (isMobileView) => isMobileView ? responsiveY(-10) : 0;
const WINHUB_INTRO_END_Z = 0;
const partBackgroundColors = { hero: "#410b7a", part1: "#0b2c7a", part2: "#0b7a48", part3: "#7a063c" };


// --- Animation Functions (기존 함수들 유지) ---
function playHeadlineCharsAnimation(animateIn) {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') return;

    const headlineDivs = document.querySelectorAll(".headline div");
    if (headlineDivs.length === 0) return;

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
    
    // [수정] will-change 속성을 추가하여 애니메이션 성능을 최적화합니다.
    // onComplete 콜백으로 애니메이션이 끝나면 속성을 제거합니다.
    gsap.set(headlineDivs, { willChange: 'transform, opacity' });
    headlineCharsAnim = gsap.timeline({ 
        onComplete: () => gsap.set(headlineDivs, { clearProps: 'will-change' }) 
    });

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
        const useSimpleToggle = element.closest('#part2') || element.closest('#part3');
        const textContentForId = element.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const triggerIdSuffix = textContentForId || `untitled-${index}`;
        const triggerId = useSimpleToggle ? `subTitleAppearTrigger-simple-${index}` : `subTitleAppearTrigger-${triggerIdSuffix}-${index}`;
        
        let splitInstance;
        try {
            splitInstance = new SplitText(element, { type: "chars" }); splitSubTitles.push(splitInstance);
            gsap.set(element, { autoAlpha: 1 });

            if (useSimpleToggle) {
                if (splitInstance.chars && splitInstance.chars.length > 0) {
                    const parentInfo = element.closest('.part2-info, .part3-info'); 
                    if (parentInfo) gsap.set(parentInfo, { autoAlpha: 1 });
                    
                    ScrollTrigger.create({ 
                        id: triggerId, 
                        trigger: element, 
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                        invalidateOnRefresh: true,
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

function togglePart3Triggers(enable) {
    const idsToToggle = [
        'splineScrollTrigger-part3',
        'mainPageBackgroundChangeTrigger-part3',
        'barMorphTrigger-part3',
        'outroContentAllTrigger'
    ];

    idsToToggle.forEach(id => {
        const trigger = ScrollTrigger.getById(id);
        if (trigger) {
            if (enable && !trigger.enabled) {
                trigger.enable(false);
            } else if (!enable && trigger.enabled) {
                trigger.disable(false);
            }
        }
    });

    ScrollTrigger.getAll().forEach(st => {
        if (st.vars.id && typeof st.vars.id === 'string' && st.vars.id.includes('subTitleAppearTrigger-simple')) {
            if (enable && !st.enabled) {
                st.enable(false);
            } else if (!enable && st.enabled) {
                st.disable(false);
            }
        }
    });
}


function setupWorksHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const pinTargetElement = document.querySelector("#part2 .part2-info");
    const list = document.querySelector("#part2 .works-list");
    if (!pinTargetElement || !list) return;

    const worksSubTitleElement = document.querySelector("#part2 .sub-title");
    let worksTitleTrigger = null;
    if (worksSubTitleElement) {
        worksTitleTrigger = ScrollTrigger.getAll().find(st => st.trigger === worksSubTitleElement);
    }

    const getXAmount = () => (!list || !pinTargetElement || pinTargetElement.offsetWidth === 0) ? 0 : -(list.scrollWidth - pinTargetElement.offsetWidth + 40);
    const getEndAmount = () => (!list || !pinTargetElement || pinTargetElement.offsetWidth === 0) ? "+=0" : "+=" + (list.scrollWidth - pinTargetElement.offsetWidth);
    
    gsap.to(list, { x: getXAmount, ease: "none", scrollTrigger: {
            id: 'worksHorizontalScrollTrigger', trigger: pinTargetElement, pin: pinTargetElement, pinType: 'fixed', start: "center center", pinSpacing: true, end: getEndAmount, anticipatePin: 1, scrub: 0.3, invalidateOnRefresh: true,
            onRefresh: (self) => { if (list) void list.offsetWidth; if (pinTargetElement) void pinTargetElement.offsetHeight; },
            onEnter: () => {
                if (worksTitleTrigger && worksTitleTrigger.enabled) worksTitleTrigger.disable(false);
                togglePart3Triggers(false);
            },
            onLeave: () => {
                if (worksTitleTrigger && !worksTitleTrigger.enabled) worksTitleTrigger.enable(false);
                togglePart3Triggers(true);
            },
            onEnterBack: () => {
                if (worksTitleTrigger && worksTitleTrigger.enabled) worksTitleTrigger.disable(false);
                togglePart3Triggers(false);
            },
            onLeaveBack: () => {
                if (worksTitleTrigger && !worksTitleTrigger.enabled) worksTitleTrigger.enable(false);
                togglePart3Triggers(true);
            }
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
                // 개선 사항: 애니메이션이 적용될 것임을 브라우저에 미리 알려 성능을 최적화합니다.
                gsap.set(self.trigger, { willChange: 'transform, opacity' });
                gsap.to(self.trigger, {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    rotationZ: 0,
                    duration: 0.6,
                    ease: "back.out(1.4)",
                    overwrite: true,
                    // 개선 사항: 애니메이션이 끝나면 will-change 속성을 제거합니다.
                    onComplete: () => gsap.set(self.trigger, { clearProps: 'will-change' })
                });
            },
            onLeaveBack: self => {
                gsap.set(self.trigger, { willChange: 'transform, opacity' });
                gsap.to(self.trigger, {
                    autoAlpha: 0,
                    y: 75,
                    scale: 0.8,
                    rotationZ: -10,
                    duration: 0.4,
                    ease: "power1.in",
                    overwrite: true,
                    onComplete: () => gsap.set(self.trigger, { clearProps: 'will-change' })
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
    splineTimelines.forEach(tl => tl.kill()); 
    splineTimelines = [];
    const currentScaleConfig = getScaleConfig(isDesktopView);
    const isMobileView = !isDesktopView;

    // Hero Section Timeline
    const heroTimeline = gsap.timeline({ 
        scrollTrigger: { 
            id: 'splineScrollTrigger-hero', 
            trigger: "#hero", 
            start: "top 10%", 
            end: "bottom bottom", 
            scrub: 0.5,
            invalidateOnRefresh: true, 
            onEnter: () => cableObj && (cableObj.visible = false), 
            onLeaveBack: () => cableObj && (cableObj.visible = false), 
            onRefresh: () => { 
                if (ScrollTrigger.isInViewport("#hero") && (!document.querySelector("#part1") || !ScrollTrigger.isInViewport("#part1"))) {
                    cableObj && (cableObj.visible = false);
                }
            }
        }
    });

    heroTimeline.to(winhubObj.position, {
        x: () => getTargetWinhubX(isMobileView),
        y: () => getTargetWinhubY(isMobileView),
        z: WINHUB_INTRO_END_Z
    }, 0)
    .to(winhubObj.rotation, { x: degToRad(0), y: degToRad(90), z: degToRad(0) }, 0)
    .to(winhubObj.scale, { 
        x: () => responsiveScale(currentScaleConfig.hero), 
        y: () => responsiveScale(currentScaleConfig.hero), 
        z: () => responsiveScale(currentScaleConfig.hero) 
    }, 0);
    splineTimelines.push(heroTimeline);

    // Part 1 Section Timeline
    if (document.getElementById('part1')) {
        const part1Timeline = gsap.timeline({ 
            scrollTrigger: { 
                id: 'splineScrollTrigger-part1', 
                trigger: "#part1", 
                start: "top 70%", 
                end: "center bottom", 
                scrub: 1, 
                invalidateOnRefresh: true, 
                onEnter: () => cableObj && (cableObj.visible = true), 
                onEnterBack: () => cableObj && (cableObj.visible = true), 
                onLeaveBack: () => cableObj && (cableObj.visible = false) 
            }
        });
        
        part1Timeline.to(winhubObj.position, {
            x: () => isMobileView ? responsiveX(-20) : responsiveX(-93.75),
            y: () => isMobileView ? responsiveY(30) : responsiveY(37.04),
            z: () => isMobileView ? responsiveX(-10) : responsiveX(-31.25)
        }, 0)
        .to(winhubObj.rotation, { x: degToRad(80.5), y: degToRad(60), z: degToRad(-65) }, 0)
        .to(winhubObj.scale, { 
            x: () => responsiveScale(currentScaleConfig.part1), 
            y: () => responsiveScale(currentScaleConfig.part1), 
            z: () => responsiveScale(currentScaleConfig.part1) 
        }, 0);
        splineTimelines.push(part1Timeline);
    }

    // Part 2 Section Timeline
    if (document.getElementById('part2')) {
        const part2Timeline = gsap.timeline({ 
            scrollTrigger: { 
                id: "part2SplineScrollTrigger", 
                trigger: "#part2", 
                start: "top 85%", 
                end: "top 30%", 
                scrub: 1, 
                invalidateOnRefresh: true, 
                onEnter: () => cableObj && (cableObj.visible = true), 
                onEnterBack: () => cableObj && (cableObj.visible = true) 
            }
        });
        
        part2Timeline.to(winhubObj.position, {
            x: () => isMobileView ? responsiveX(20) : responsiveX(50),
            y: () => isMobileView ? responsiveY(15) : responsiveY(10),
            z: () => isMobileView ? responsiveX(-5) : responsiveX(-20)
        }, 0)
        .to(winhubObj.rotation, { x: degToRad(40), y: degToRad(60), z: degToRad(-60) }, 0)
        .to(winhubObj.scale, { 
            x: () => responsiveScale(currentScaleConfig.part2 * 0.8), 
            y: () => responsiveScale(currentScaleConfig.part2 * 0.8), 
            z: () => responsiveScale(currentScaleConfig.part2 * 0.8) 
        }, 0);
        splineTimelines.push(part2Timeline);
    }

    // Part 3 Section Timeline
    if (document.getElementById('part3')) {
        const part3Timeline = gsap.timeline({ 
            scrollTrigger: { 
                id: 'splineScrollTrigger-part3', 
                trigger: "#part3", 
                start: "top 30%", 
                end: "center bottom", 
                scrub: 1, 
                invalidateOnRefresh: true, 
                onEnter: () => cableObj && (cableObj.visible = true) 
            }
        });
        
        part3Timeline.to(winhubObj.position, {
            x: () => isMobileView ? responsiveX(-30) : responsiveX(-61.67),
            y: () => isMobileView ? responsiveY(70) : responsiveY(80.11),
            z: 0
        }, 0)
        .to(winhubObj.rotation, { x: degToRad(90), y: degToRad(-25), z: degToRad(-20) }, 0)
        .to(winhubObj.scale, { 
            x: () => responsiveScale(currentScaleConfig.part3), 
            y: () => responsiveScale(currentScaleConfig.part3), 
            z: () => responsiveScale(currentScaleConfig.part3) 
        }, 0);
        splineTimelines.push(part3Timeline);
    }
}



function setupAdvantageCardAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const cards = gsap.utils.toArray("#part1 .advantage-card, #part1 .integrated-value-card");
    
    cards.forEach((card, index) => {
        gsap.set(card, { autoAlpha: 0, y: 50 });
        
        ScrollTrigger.create({
            id: `advantageCardTrigger-${index}`,
            trigger: card,
            start: "top 85%",
            end: "bottom 15%",
            invalidateOnRefresh: true,
            onEnter: () => {
                // 개선 사항: will-change 추가
                gsap.set(card, { willChange: 'transform, opacity' });
                gsap.to(card, {
                    autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", delay: index * 0.1, overwrite: true,
                    onComplete: () => gsap.set(card, { clearProps: 'will-change' }) // 개선 사항: will-change 제거
                });
            },
            onLeave: () => {
                gsap.set(card, { willChange: 'transform, opacity' });
                gsap.to(card, {
                    autoAlpha: 0, y: 50, duration: 0.3, ease: "power1.in", overwrite: true,
                    onComplete: () => gsap.set(card, { clearProps: 'will-change' })
                });
            },
            onEnterBack: () => {
                gsap.set(card, { willChange: 'transform, opacity' });
                gsap.to(card, {
                    autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", delay: index * 0.1, overwrite: true,
                    onComplete: () => gsap.set(card, { clearProps: 'will-change' })
                });
            },
            onLeaveBack: () => {
                gsap.set(card, { willChange: 'transform, opacity' });
                gsap.to(card, {
                    autoAlpha: 0, y: 50, duration: 0.3, ease: "power1.in", overwrite: true,
                    onComplete: () => gsap.set(card, { clearProps: 'will-change' })
                });
            }
        });
    });
}

function setupOutroContentAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const outroContentContainer = document.querySelector("#part3 .outro-content"); if (!outroContentContainer) return;
    const part3Info = outroContentContainer.closest('.part3-info'); if (part3Info) gsap.set(part3Info, { autoAlpha: 1 });
    gsap.set(outroContentContainer, { autoAlpha: 1 });
    const elementsToAnimate = gsap.utils.toArray(outroContentContainer.children); if (elementsToAnimate.length === 0) return;
    gsap.set(elementsToAnimate, { autoAlpha: 0, y: 40 });
    
    ScrollTrigger.create({
        id: `outroContentAllTrigger`,
        trigger: outroContentContainer,
        start: "top 80%",
        invalidateOnRefresh: true,
        toggleActions: "play none none reverse",
        onEnter: () => {
            gsap.set(elementsToAnimate, { willChange: 'transform, opacity' });
            gsap.to(elementsToAnimate, {
                autoAlpha: 1, y: 0, color: '', duration: 0.5, ease: "power2.out", stagger: 0.15,
                onComplete: () => gsap.set(elementsToAnimate, { clearProps: 'will-change' })
            });
        },
        onLeaveBack: () => {
            gsap.set(elementsToAnimate, { willChange: 'transform, opacity' });
            gsap.to(elementsToAnimate, {
                autoAlpha: 0, y: 40, duration: 0.3, ease: "power1.in",
                onComplete: () => gsap.set(elementsToAnimate, { clearProps: 'will-change' })
            });
        },
    });
}

function setupScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (!scrollToTopBtn) return;

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
        const triggers = typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getAll() : [];
        triggers.forEach(trigger => trigger.disable(true));
        window.scrollTo({ top: 0, behavior: 'auto' });
        gsap.set(document.body, { backgroundColor: partBackgroundColors.hero });
        const scrollIcon = document.querySelector(".scroll-icon");
        if (scrollIcon) {
            gsap.set(scrollIcon, { autoAlpha: 1 });
        }
        const headerLogo = document.querySelector("#header-placeholder .com-name-logo");
        if (headerLogo) {
            gsap.set(headerLogo, { autoAlpha: 0 });
        }

        setTimeout(() => {
            triggers.forEach(trigger => trigger.enable());
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh(true);
            }
        }, 100); 
    });
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
    worksListContainer.innerHTML = '';
    worksData.forEach(work => {
        const listItem = document.createElement('li');
        listItem.classList.add('work-item');

        const link = document.createElement('a');
        link.href = buildUrl(`/page/works_details/works-detail.html?id=${work.id}`);
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


// [성능 개선] 무거운 3D 에셋과 라이브러리를 비동기적으로 로드하는 함수
async function initializeHeavyAssets() {
    try {
        // 1. 필요한 라이브러리를 동적으로 import 합니다.
        const { Application } = await import('https://unpkg.com/@splinetool/runtime/build/runtime.js');
        const { InteractiveBackgroundSphere, loadSplineScene } = await import('./common-utils.js');
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
        window.THREE = THREE; // Spline 런타임이 참조할 수 있도록 전역에 할당

        // 2. Spline 씬을 로드합니다.
        const splineCanvas = document.getElementById("canvas3d");
        if (splineCanvas) gsap.set(splineCanvas, { autoAlpha: 0 });

        mainSplineApp = await loadSplineScene("canvas3d", "https://prod.spline.design/0FDfaGjmdgz0JYwR/scene.splinecode", Application);
        
        if (mainSplineApp) {
            winhub = mainSplineApp.findObjectByName("Winhub");
            cable = mainSplineApp.findObjectByName("cable");
            if (winhub) winhub.visible = false;
            if (cable) cable.visible = false;
        } else {
            console.error("MAIN-APP: Main Spline App could not be loaded.");
        }

        // 3. 인터랙티브 배경 구체를 인스턴스화합니다. init()은 애니메이션 시작 시점에 호출됩니다.
        mainPageBackgroundSphere = new InteractiveBackgroundSphere('threejs-background-container', THREE);

    } catch (error) {
        console.error("Error initializing heavy assets:", error);
        return Promise.reject(error); // 에셋 로딩 실패 시 Promise를 reject
    }
}

// 히어로 인트로 완료 후 호출될 콜백 함수
function onHeroIntroComplete() {
    // 인트로 애니메이션이 모두 완료된 후 스크롤 트리거를 설정합니다.
    if (!initialSetupDone) {
        setupResponsiveScrollTriggers();
        initialSetupDone = true;
    }

    enableScrollInteraction();

    const menuIcon = document.querySelector(".menu-icon");
    if (menuIcon) gsap.to(menuIcon, { duration: 0.8, autoAlpha: 1, ease: "power2.out" });

    const scrollIcon = document.querySelector(".scroll-icon");
    if (scrollIcon) gsap.to(scrollIcon, { duration: 0.8, autoAlpha: 1, ease: "power2.out" });

    // ScrollTrigger.refresh()는 setupAllScrollTriggers 내에서 호출되지만,
    // 모든 것이 안정된 후 마지막으로 한 번 더 호출해주는 것이 안전합니다.
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
    }
    
    // *** FIX: 헤드라인 재재생 방지를 위해 트리거 활성화를 지연시킵니다. ***
    // ScrollTrigger.refresh()가 완료된 후 트리거가 활성화되도록 하여, 초기 로드 시 불필요한 재실행을 막습니다.
    gsap.delayedCall(0.1, () => {
        heroHeadlineTriggerEnabled = true;
    });
}

// Spline 인트로 애니메이션을 별도 함수로 분리
function playSplineIntroAnimation() {
    const splineCanvas = document.getElementById("canvas3d");
    if (!splineCanvas || !winhub) {
        // Spline 로딩 실패 시에도 UI는 활성화되어야 합니다.
        onHeroIntroComplete();
        return;
    }

    const isMobileViewInitial = window.innerWidth <= 767;
    const introTl = gsap.timeline({
        onComplete: onHeroIntroComplete
    });

    introTl.to(splineCanvas, { autoAlpha: 1, duration: 1 }, 0)
        .call(() => winhub.visible = true, null, "<")
        .fromTo(winhub.scale, 
            { x: responsiveScale(getScaleConfig(!isMobileViewInitial).hero * 0.5), y: responsiveScale(getScaleConfig(!isMobileViewInitial).hero * 0.5), z: responsiveScale(getScaleConfig(!isMobileViewInitial).hero * 0.5) }, 
            { x: responsiveScale(getScaleConfig(!isMobileViewInitial).hero), y: responsiveScale(getScaleConfig(!isMobileViewInitial).hero), z: responsiveScale(getScaleConfig(!isMobileViewInitial).hero), duration: 1.5, ease: "power3.out" }, 
            "<+0.1")
        .fromTo(winhub.rotation, 
            { x: degToRad(90), y: degToRad(-360), z: degToRad(5) }, 
            { x: degToRad(0), y: degToRad(90), z: degToRad(0), duration: 1.5, ease: "power3.out" }, 
            "<")
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

// [성능 개선] 메인 시퀀스: 성능과 애니메이션 순서를 모두 최적화
async function runMainPageSequence() {
    // 1. 로더를 실행하고, 완료되면 즉시 기본 콘텐츠를 보여줍니다.
    await runLoaderSequence('.part-container');
    
    // 2. 무거운 에셋 로딩을 백그라운드에서 시작합니다.
    const heavyAssetsPromise = initializeHeavyAssets();

    // 3. 가벼운 텍스트 인트로 애니메이션을 실행합니다.
    const comNameElement = document.querySelector(".com-name-ani");
    const heroTextBlock = document.querySelector('.hero-text-block');

    if (!comNameElement || !heroTextBlock) {
        console.error("Missing critical hero text elements for intro animation.");
        // [수정] 3D 에셋이 로드되길 기다렸다가 완료 처리를 합니다.
        onLightIntroComplete(heavyAssetsPromise); 
        return;
    }

    // [수정] 텍스트 애니메이션을 시작하기 전에
    // 3D 에셋 로딩과 폰트 로딩을 *먼저* 기다립니다.
    // 이렇게 하면 새로고침 시 병목 현상이 사라집니다.
    try {
        await Promise.all([heavyAssetsPromise, document.fonts.ready]);
    } catch (error) {
        console.error("Failed to await heavy assets or fonts, proceeding anyway...", error);
    }
    // --------------------------------------------------
    
    gsap.set(comNameElement, { autoAlpha: 0 });
    gsap.set(".headline", { autoAlpha: 0 });
    gsap.set(".headline div", { autoAlpha: 0 });

    const masterIntroTimeline = gsap.timeline({ onComplete: onLightIntroComplete, onCompleteParams: [heavyAssetsPromise] });
    
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

    // [수정] com-name-ani 애니메이션 시작 전 will-change 설정
    gsap.set(comNameElement, { willChange: 'transform, opacity' });

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

    // [수정] com-name-ani 애니메이션이 모두 끝난 후 will-change 제거
    masterIntroTimeline.call(() => {
        gsap.set(comNameElement, { clearProps: 'will-change' });
    }, null, ">"); // 바로 직전의 애니메이션이나 콜백이 끝난 직후 실행

    const headlineStartTime = ">-0.2";
    masterIntroTimeline
        .set(".headline", { autoAlpha: 1 }, headlineStartTime)
        .from(".headline", { xPercent: -100, duration: 0.8, ease: "power3.out" }, "<")
        .addLabel("startHeadlineChars", ">-0.2");

    const headlineDivs = document.querySelectorAll(".headline div");
    if (headlineDivs.length > 0) {
        // [수정] 인트로 애니메이션 시작 전 will-change 설정
        gsap.set(headlineDivs, { willChange: 'transform, opacity' });

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
            }
        });

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
        
        // [수정] 인트로 애니메이션 완료 후 will-change 제거
        masterIntroTimeline.call(() => gsap.set(headlineDivs, { clearProps: 'will-change' }), null, ">");
    }
}


// 가벼운 인트로 완료 후 호출되는 콜백 함수
async function onLightIntroComplete(heavyAssetsPromise) {
    window.scrollTo(0, 0);

    try {
        // [수정] 위에서 이미 await 했지만,
        // 에러 핸들링이나 로직의 견고함을 위해 여기서 다시 확인/대기합니다.
        // (이미 완료되었다면 즉시 통과됩니다)
        await Promise.all([heavyAssetsPromise, document.fonts.ready]);

        // 배경 구체 애니메이션 시작
        if (mainPageBackgroundSphere && mainPageBackgroundSphere.valid) {
            mainPageBackgroundSphere.init().introAnimate();
        }
        
        // Spline 오브젝트 애니메이션 시작 (이 애니메이션이 끝나면 onHeroIntroComplete가 호출됨)
        if (mainSplineApp) {
            playSplineIntroAnimation();
        } else {
            // Spline 앱이 없으면 바로 UI 활성화 함수를 호출합니다.
            onHeroIntroComplete();
        }

    } catch (error) {
        console.error("Failed to start animations for heavy assets or fonts:", error);
        // 에러 발생 시 UI를 활성화하여 페이지가 멈추지 않도록 합니다.
        onHeroIntroComplete();
    }
}

// 모든 ScrollTrigger를 설정하는 함수
async function setupAllScrollTriggers(isDesktopView) {
    await document.fonts.ready;

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
    setupAdvantageCardAnimations();
    setupOutroContentAnimation();
    setupHeaderLogoScrollAnimation();
    setupHeroHeadlineScrollTrigger();
    setupSubTitleAnimation();
    setupWorksHorizontalScroll();
    setupWorkItemAnimations();
    setupScrollToTopButton();
    setupScrollIconAnimation();
    
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }
    if (initialSetupDone) heroHeadlineTriggerEnabled = true;
}

// 반응형 ScrollTrigger 설정
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

// --- Main Sequence ---
document.addEventListener('DOMContentLoaded', async () => {
    setViewportHeight();
    window.scrollTo(0, 0);
    setupScrollRestoration();
    disableScrollInteraction(); // 페이지 로드 시 스크롤 비활성화
    
    // *** FIX: 리사이즈 시 히어로 영역 Spline 오브젝트 상태를 안정적으로 재설정합니다. ***
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.addEventListener) {
        ScrollTrigger.addEventListener("refresh", () => {
            // 페이지 상단에 있을 때(스크롤이 거의 없을 때)만 이 로직을 실행합니다.
            if (winhub && window.scrollY < 10) { 
                const isMobileView = window.innerWidth <= 767;
                const isDesktopView = !isMobileView;
                const currentScaleConfig = getScaleConfig(isDesktopView);

                // 현재 뷰포트에 맞는 정확한 값으로 Spline 오브젝트의 상태를 즉시 설정합니다.
                gsap.set(winhub.position, {
                    x: getTargetWinhubX(isMobileView),
                    y: getTargetWinhubY(isMobileView),
                    z: WINHUB_INTRO_END_Z
                });
                gsap.set(winhub.rotation, { 
                    x: degToRad(0), 
                    y: degToRad(90), 
                    z: degToRad(0) 
                });
                gsap.set(winhub.scale, { 
                    x: responsiveScale(currentScaleConfig.hero), 
                    y: responsiveScale(currentScaleConfig.hero), 
                    z: responsiveScale(currentScaleConfig.hero) 
                });
                if (cable) {
                   cable.visible = false;
                }
            }
        });
    }
    
    try {
        await loadCommonUI();
        const headerLogoForEarlyHide = document.querySelector("#header-placeholder .com-name-logo");
        if (headerLogoForEarlyHide) gsap.set(headerLogoForEarlyHide, { autoAlpha: 0 });

        populateWorksList();

        await document.fonts.ready;
        runMainPageSequence().catch(error => {
            console.error("Error in runMainPageSequence:", error);
            hideLoaderOnError();
            // 에러 발생 시에도 UI는 활성화되어야 합니다.
            onHeroIntroComplete();
        });
    } catch (error) {
        console.error("Failed to load common UI or initialize its scripts:", error);
        hideLoaderOnError();
        enableScrollInteraction(); // UI 로딩 실패 시 스크롤 활성화
    }
});

window.addEventListener('load', () => {
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.refresh(true);
  }
});