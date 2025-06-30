// -----------------------------------------
// main-app.js
// Description: Script for the main page (index.html).
// Imports: SplineRuntime, THREE, GSAP, common-utils.js
// -----------------------------------------

// Spline Runtime (if directly used by main-app, otherwise common-utils might handle it)
import { Application as SplineRuntimeApp } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

// THREE.js
import * as THREE_MOD from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
window.THREE = THREE_MOD; // Expose THREE to the global scope for common-utils or other scripts

// GSAP Plugins (Core GSAP is loaded via <script> in HTML)
import { Draggable } from "https://esm.sh/gsap/Draggable";
import { SplitText } from "https://esm.sh/gsap/SplitText";
import { MorphSVGPlugin } from "https://esm.sh/gsap/MorphSVGPlugin";
// ScrollTrigger and ScrambleTextPlugin are imported and registered in common-utils.js

// Register GSAP plugins
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(Draggable, SplitText, MorphSVGPlugin);
    console.log("MAIN-APP: GSAP Draggable, SplitText, and MorphSVGPlugin registered via ES module imports.");
} else {
    console.error("MAIN-APP: GSAP core library is not loaded from HTML. Plugins cannot be registered.");
}

// Imports from common-utils
import {
    setupScrollRestoration,
    degToRad,
    responsiveScale,
    responsiveX,
    responsiveY,
    startLoaderBarAnimation,
    hideLoader,
    InteractiveBackgroundSphere,
    setupMenu,
    setupMenuLinkEffects,
    loadSplineScene,
    killAllScrollTriggers,
    killScrollTriggersByPattern
} from './common-utils.js';

// --- Global Variables for Main Page ---
let mainSplineApp = null;
let winhub = null,
    cable = null,
    splineTimelines = [];

let splitH1;
let splitComName;
let splitSubTitles = [];
let splitHeadlineChars = [];

let mainPageBackgroundSphere = null;

let isDesktop = window.innerWidth >= 768;
const getScaleConfig = () => {
    isDesktop = window.innerWidth >= 768;
    return {
        hero: isDesktop ? 130 : 220,
        part1: isDesktop ? 200 : 500,
        part2: isDesktop ? 200 : 500,
        part3: isDesktop ? 200 : 500
    };
};

const barShapesConfig = {
    initial: "M0 5 L0 5 L0 5 L0 5 Z",
    part1Enter: "M0,5 Q15,0 30,4 Q50,7 70,4 Q85,0 100,5 V5 Q85,10 70,6 Q50,3 30,6 Q15,10 0,5 Z",
    part2Enter: "M0,5 C20,-5 40,15 50,5 C60,-5 80,15 100,5 V5 C80,0 60,10 50,5 C40,0 20,10 0,5 Z",
    part3Enter: "M0,5 Q20,10 40,5 Q60,0 80,5 Q100,10 100,5 V5 Q80,0 60,5 Q40,10 20,5 Q0,0 0,5 Z",
    full: "M0,0 H100 V10 H0 Z"
};

const getTargetWinhubX = () => responsiveX(30);
const WINHUB_INTRO_END_Y = 0;
const WINHUB_INTRO_END_Z = 0;

// -----------------------------------------
// Main Page Specific Animation Setup Functions
// -----------------------------------------
function setupSubTitleAnimation() {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP, SplitText, or ScrollTrigger not loaded/registered for setupSubTitleAnimation.");
        return;
    }
    const subTitleElements = document.querySelectorAll(".sub-title");
    if (subTitleElements.length === 0) {
        console.warn("MAIN-APP: .sub-title elements not found for animation.");
        return;
    }

    killScrollTriggersByPattern('subTitleAppearTrigger-');
    if (splitSubTitles && splitSubTitles.length > 0) {
        splitSubTitles.forEach(splitInstance => { if (splitInstance) splitInstance.revert(); });
    }
    splitSubTitles = [];

    subTitleElements.forEach((element, index) => {
        try {
            const splitInstance = new SplitText(element, { type: "chars" });
            splitSubTitles.push(splitInstance);

            const isOutroTitle = element.closest('#part3');
            let currentToggleActions = "restart reverse restart reverse";
            let onLeaveUserCallback = (self) => { // self is the ScrollTrigger instance
                if (splitInstance && splitInstance.chars) {
                    gsap.to(splitInstance.chars, { opacity: 0, y: 70, duration: 0.3, ease: "power1.in", stagger: { each: 0.04, from: "end" }, overwrite: true });
                }
            };
            let onLeaveBackUserCallback = (self) => {
                 if (splitInstance && splitInstance.chars) {
                    gsap.to(splitInstance.chars, { opacity: 0, y: -60, duration: 0.3, ease: "power1.in", stagger: { each: 0.04, from: "start" }, overwrite: true });
                }
            };


            if (isOutroTitle) {
                // For OUTRO: Play on enter, do nothing on leave (scrolling down past),
                // Restart on enterBack (scrolling up into view), reverse on leaveBack (scrolling up past)
                currentToggleActions = "restart none restart reverse";
                onLeaveUserCallback = null; // Handled by "none" in toggleActions for downward scroll
            }

            ScrollTrigger.create({
                id: `subTitleAppearTrigger-${index}`,
                trigger: element,
                start: "top 85%",
                toggleActions: currentToggleActions,
                onEnter: () => {
                    if (splitInstance && splitInstance.chars) {
                        gsap.fromTo(splitInstance.chars,
                            { opacity: 0, y: -60 },
                            { opacity: 1, y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.08, overwrite: true }
                        );
                    }
                },
                onLeave: onLeaveUserCallback, // Will be null for outro, effectively doing nothing
                onEnterBack: () => {
                    if (splitInstance && splitInstance.chars) {
                        gsap.fromTo(splitInstance.chars,
                            { opacity: 0, y: -60 }, // Or y: 70 if coming from bottom
                            { opacity: 1, y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.08, overwrite: true }
                        );
                    }
                },
                onLeaveBack: onLeaveBackUserCallback
            });
        } catch (e) {
            console.error("MAIN-APP: Error creating SplitText for .sub-title:", element, e);
        }
    });
}

function setupWorksHorizontalScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP or ScrollTrigger not loaded/registered for setupWorksHorizontalScroll.");
        return;
    }

    // MODIFICATION: Target .part2-info for pinning
    const pinTargetElement = document.querySelector("#part2 .part2-info");
    const list = document.querySelector("#part2 .works-list");
    // const items = gsap.utils.toArray("#part2 .work-item"); // items not directly used in this ST

    if (!pinTargetElement || !list ) { // || items.length === 0
        console.warn("MAIN-APP: Elements for works horizontal scroll not found (pinTargetElement or list).");
        return;
    }

    killScrollTriggersByPattern('worksHorizontalScrollTrigger');

    gsap.to(list, {
        x: () => -(list.scrollWidth - pinTargetElement.offsetWidth + 40), // Adjust offset if needed, +40 for potential padding/margin
        ease: "none",
        scrollTrigger: {
            id: 'worksHorizontalScrollTrigger',
            trigger: pinTargetElement, // MODIFICATION: Trigger is the element being pinned
            pin: pinTargetElement,     // MODIFICATION: Pin .part2-info
            start: "center center",
            pinSpacing: true,
            end: () => "+=" + (list.scrollWidth - pinTargetElement.offsetWidth), // Adjust if list is wider than its direct container
            anticipatePin: 1,
            scrub: 1.2,
            invalidateOnRefresh: true,
            // markers: true, // Uncomment for debugging
            onToggle: self => { // self is the ScrollTrigger instance
                const part2SplineST = ScrollTrigger.getById("part2SplineScrollTrigger");
                if (part2SplineST) {
                    if (self.isActive) {
                        console.log("MAIN-APP: Horizontal scroll active, disabling part2SplineScrollTrigger.");
                        part2SplineST.disable(false); // false: don't revert, just pause
                    } else {
                        console.log("MAIN-APP: Horizontal scroll inactive, enabling part2SplineScrollTrigger.");
                        part2SplineST.enable(false); // false: don't force immediate state, just allow it to resume
                        // part2SplineST.refresh(); // May not be needed, could cause jump if progress is off
                    }
                } else {
                    console.warn("MAIN-APP: part2SplineScrollTrigger not found for onToggle.");
                }
            }
        }
    });
    console.log("MAIN-APP: Works horizontal scroll setup complete. Pinning .part2-info.");
}


function setupComNameScrollAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP or ScrollTrigger not loaded/registered for setupComNameScrollAnimation.");
        return;
    }
    const comNameElement = document.querySelector(".com-name-ani");
    if (!comNameElement) {
        console.warn("MAIN-APP: .com-name-ani element not found for scroll font size animation.");
        return;
    }
    killScrollTriggersByPattern('comNameSizeTrigger');

    ScrollTrigger.create({
        id: 'comNameSizeTrigger',
        trigger: "#hero",
        start: "70% top",
        onLeave: () => {
            gsap.to(comNameElement, {
                fontSize: "24px", position: "fixed", 
                top: "35px", // MODIFICATION: Increased top from 28px to 35px
                left: "20px",
                duration: 0.4, ease: "power1.out", overwrite: 'auto'
            });
        },
        onEnterBack: () => {
            gsap.to(comNameElement, {
                fontSize: "7vw", position: "absolute", top: "-150px", left: "0px",
                duration: 0.4, ease: "power1.out", overwrite: 'auto'
            });
        }
    });
}


function setupMainPageBackgroundGradientAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP or ScrollTrigger not loaded/registered for setupMainPageBackgroundGradientAnimations.");
        return;
    }
    killScrollTriggersByPattern('mainPageBackgroundGradientTrigger');

    const gradientTargets = {
        hero: { x: '50%', y: '50%', color: '#09388f' },
        part1: { x: '40%', y: '60%', color: '#610e85' },
        part2: { x: '60%', y: '40%', color: '#086743' },
        part3: { x: '50%', y: '70%', color: '#770303' },
    };

    gsap.set('body', {
        '--gradient-center-x': gradientTargets.hero.x,
        '--gradient-center-y': gradientTargets.hero.y,
        '--gradient-color-center': gradientTargets.hero.color
    });

    ['part1', 'part2', 'part3'].forEach(partId => {
        const sectionElement = document.getElementById(partId);
        if (sectionElement) {
            gsap.to('body', {
                '--gradient-center-x': gradientTargets[partId].x,
                '--gradient-center-y': gradientTargets[partId].y,
                '--gradient-color-center': gradientTargets[partId].color,
                scrollTrigger: {
                    id: `mainPageBackgroundGradientTrigger-${partId}`,
                    trigger: sectionElement,
                    start: 'top bottom',
                    end: 'center center',
                    scrub: 1.5,
                }
            });
        }
    });
}

function setupSplineScrollAnimations(winhubObj, cableObj) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP or ScrollTrigger not loaded/registered for setupSplineScrollAnimations.");
        return;
    }
    splineTimelines.forEach(tl => tl.kill());
    splineTimelines = [];
    killScrollTriggersByPattern('splineScrollTrigger-'); // Kill specific spline scroll triggers by ID pattern

    const currentScaleConfig = getScaleConfig();

    const heroTimeline = gsap.timeline({
        scrollTrigger: {
            id: 'splineScrollTrigger-hero', // Added ID
            trigger: "#hero", start: "top 10%", end: "bottom bottom", scrub: true,
            onEnter: () => { if (cableObj) cableObj.visible = false; },
            onLeaveBack: () => { if (cableObj) cableObj.visible = false; },
            onRefresh: () => {
                if (ScrollTrigger.isInViewport("#hero") && (!document.querySelector("#part1") || !ScrollTrigger.isInViewport("#part1"))) {
                    if (cableObj) cableObj.visible = false;
                }
            }
        }
    });
    splineTimelines.push(heroTimeline);


    if (document.getElementById('part1')) {
        const part1Timeline = gsap.timeline({
            scrollTrigger: {
                id: 'splineScrollTrigger-part1', // Added ID
                trigger: "#part1", start: "top 30%", end: "center bottom", scrub: 2,
                onEnter: () => { if (cableObj) cableObj.visible = true; },
                onEnterBack: () => { if (cableObj) cableObj.visible = true; },
                onLeaveBack: () => { if (cableObj) cableObj.visible = false; }
            }
        })
        .to(winhubObj.position, { x: responsiveX(-93.75), y: responsiveY(37.04), z: responsiveX(-31.25) }, 0)
        .to(winhubObj.rotation, { x: degToRad(80.5), y: degToRad(60), z: degToRad(-65) }, 0)
        .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.part1), y: responsiveScale(currentScaleConfig.part1), z: responsiveScale(currentScaleConfig.part1) }, 0);
        splineTimelines.push(part1Timeline);
    }

    if (document.getElementById('part2')) {
        const part2SplineTimeline = gsap.timeline({
            scrollTrigger: {
                id: "part2SplineScrollTrigger", // MODIFICATION: Added ID for disabling/enabling
                trigger: "#part2",
                start: "top center",
                end: "bottom top", // This means the animation occurs as #part2 section scrolls through the viewport
                scrub: 2,
                onEnter: () => { if (cableObj) cableObj.visible = true; },
                onLeave: () => { if (cableObj) cableObj.visible = true; }, // Keep cable visible as part2 might still be in view due to horizontal scroll
                onEnterBack: () => { if (cableObj) cableObj.visible = true; },
            }
        });
        part2SplineTimeline
            .to(winhubObj.rotation, { x: degToRad(40), y: degToRad(60), z: degToRad(-60) }, 0)
            .to(winhubObj.position, { x: responsiveX(50), y: responsiveY(10), z: responsiveX(-20) }, 0)
            .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.part2 * 0.8), y: responsiveScale(currentScaleConfig.part2 * 0.8), z: responsiveScale(currentScaleConfig.part2 * 0.8) }, 0);
        splineTimelines.push(part2SplineTimeline);
    }

    if (document.getElementById('part3')) {
        const part3Timeline = gsap.timeline({
            scrollTrigger: {
                id: 'splineScrollTrigger-part3', // Added ID
                trigger: "#part3", start: "top 30%", end: "center bottom", scrub: 2,
                onEnter: () => { if (cableObj) cableObj.visible = true; }
            }
        })
        .to(winhubObj.rotation, { x: degToRad(90), y: degToRad(-25), z: degToRad(-20) }, 0)
        .to(winhubObj.scale, { x: responsiveScale(currentScaleConfig.part3), y: responsiveScale(currentScaleConfig.part3), z: responsiveScale(currentScaleConfig.part3) }, 0)
        .to(winhubObj.position, { x: responsiveX(-41.67), y: responsiveY(11.11), z: 0 }, 0);
        splineTimelines.push(part3Timeline);
    }
}

function setupBarAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP or ScrollTrigger not loaded/registered for setupBarAnimations.");
        return;
    }
    const barPathElement = document.querySelector("#barElementPath");

    if (!gsap.plugins.morphSVG) {
        console.warn("MAIN-APP: MorphSVGPlugin is not available or not registered. Using fallback rectangular bar animation.");
        const barElement = document.querySelector(".bar");
        if (!barElement) {
            console.warn("MAIN-APP: Fallback .bar element not found for rectangular bar animation.");
            return;
        }
        killScrollTriggersByPattern('barRectTrigger-');
        gsap.set(barElement, { width: "0%" });

        function animateRectBar(sectionSelector, enterW, leaveWStart) {
            const section = document.querySelector(sectionSelector);
            if (!section) return;
            gsap.to(barElement, {
                scrollTrigger: {
                    id: `barRectTrigger-${sectionSelector.replace('#', '')}`,
                    trigger: section, start: "top center", end: "bottom bottom", scrub: 1,
                    onEnter: () => gsap.to(barElement, { width: enterW, duration: 0.3, ease: "none" }),
                    onLeave: () => gsap.to(barElement, { width: enterW, duration: 0.3, ease: "none" }),
                    onEnterBack: () => gsap.to(barElement, { width: enterW, duration: 0.3, ease: "none" }),
                    onLeaveBack: () => gsap.to(barElement, { width: leaveWStart, duration: 0.3, ease: "none" })
                }
            });
        }
        if (document.getElementById('part1')) animateRectBar("#part1", "70%", "0%");
        if (document.getElementById('part2')) animateRectBar("#part2", "35%", "70%");
        if (document.getElementById('part3')) animateRectBar("#part3", "100%", "35%");
        return;
    }

    if (!barPathElement) {
        console.error("MAIN-APP: SVG path element for bar (#barElementPath) not found. Ensure HTML is updated.");
        return;
    }
    console.log("MAIN-APP: MorphSVGPlugin is available. Setting up SVG bar animations.");
    killScrollTriggersByPattern('barMorphTrigger-');
    gsap.set(barPathElement, { morphSVG: barShapesConfig.initial });

    function animateBarSVG(sectionId, targetShapeKey, leaveBackShapeKey, nextShapeKey = null) {
        const section = document.getElementById(sectionId);
        if (!section) {
            console.warn(`MAIN-APP: Section element '#${sectionId}' for bar animation not found.`);
            return;
        }
        const targetShapeD = barShapesConfig[targetShapeKey];
        const leaveBackShapeD = barShapesConfig[leaveBackShapeKey];
        const nextTargetShapeD = nextShapeKey ? barShapesConfig[nextShapeKey] : targetShapeD;
        if (!targetShapeD || !leaveBackShapeD) {
            console.error(`MAIN-APP: Invalid shape keys for section ${sectionId}: target='${targetShapeKey}', leaveBack='${leaveBackShapeKey}'`);
            return;
        }

        ScrollTrigger.create({
            id: `barMorphTrigger-${sectionId}`,
            trigger: section,
            start: "top center",
            end: "bottom bottom",
            onEnter: () => gsap.to(barPathElement, { duration: 0.5, morphSVG: targetShapeD, ease: "power1.out" }),
            onLeave: () => gsap.to(barPathElement, { duration: 0.5, morphSVG: nextTargetShapeD, ease: "power1.out" }),
            onEnterBack: () => gsap.to(barPathElement, { duration: 0.5, morphSVG: targetShapeD, ease: "power1.out" }),
            onLeaveBack: () => gsap.to(barPathElement, { duration: 0.5, morphSVG: leaveBackShapeD, ease: "power1.out" })
        });
    }
    animateBarSVG("part1", "part1Enter", "initial", "part2Enter");
    animateBarSVG("part2", "part2Enter", "part1Enter", "part3Enter");
    animateBarSVG("part3", "part3Enter", "part2Enter", "full");
}

function setupH1TextAnimation() {
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("MAIN-APP: GSAP, SplitText, or ScrollTrigger not loaded/registered for setupH1TextAnimation.");
        return;
    }
    const h1Elements = document.querySelectorAll("h1"); // Selects all h1s, might need refinement if only specific h1s
    if (h1Elements.length === 0) return;

    killScrollTriggersByPattern("h1LineScrollTrigger-");
    if (splitH1 && typeof splitH1.revert === 'function') splitH1.revert();


    // Filter for h1 elements that are direct children of .partX-info.text
    const textH1Elements = gsap.utils.toArray("h1").filter(h1 => h1.parentElement && h1.parentElement.classList.contains('text') && h1.parentElement.classList.contains('part1-info') || (h1.parentElement && h1.parentElement.classList.contains('text') && h1.parentElement.classList.contains('part3-info')));


    if (textH1Elements.length === 0) {
        console.warn("MAIN-APP: No h1 elements found within '.partX-info.text' for line animation.");
        return;
    }

    try {
        splitH1 = new SplitText(textH1Elements, { type: "lines" }); // Apply only to filtered H1s
        splitH1.lines.forEach((line, lineIndex) => {
            gsap.set(line, { backgroundPositionX: "100%" });
            gsap.to(line, {
                backgroundPositionX: "0%",
                ease: "none",
                scrollTrigger: {
                    id: `h1LineScrollTrigger-${lineIndex}`,
                    trigger: line,
                    scrub: 2,
                    start: "top 50%", // Adjusted for potentially taller lines
                    end: "bottom 90%", // Adjusted
                    invalidateOnRefresh: true
                }
            });
        });
    } catch (e) {
        console.error("MAIN-APP: Error creating SplitText for h1:", e);
    }
}

// -----------------------------------------
// Main Animation Sequence for Main Page
// -----------------------------------------
async function runMainPageSequence() {
    console.log("MAIN-APP: Running main page sequence...");
    if (typeof gsap === 'undefined' || typeof SplitText === 'undefined') {
        console.error("MAIN-APP: GSAP or SplitText not loaded/registered for runMainPageSequence.");
        await hideLoader();
        return;
    }

    const loaderBarPromise = startLoaderBarAnimation({ barDuration: 1.5 });

    const criticalLoadPromises = [];
    const splineCanvas = document.getElementById("canvas3d");
    if (splineCanvas) gsap.set(splineCanvas, { autoAlpha: 0 });

    const splineLoadPromise = loadSplineScene("canvas3d", "https://prod.spline.design/0FDfaGjmdgz0JYwR/scene.splinecode")
        .then(app => {
            mainSplineApp = app;
            if (mainSplineApp) {
                winhub = mainSplineApp.findObjectByName("Winhub");
                cable = mainSplineApp.findObjectByName("cable");
                if (winhub) winhub.visible = false;
                if (cable) cable.visible = false;
                if (!winhub || !cable) {
                    console.error("MAIN-APP: Missing critical Spline objects (Winhub or cable).");
                }
            } else {
                console.error("MAIN-APP: Main Spline App could not be loaded.");
            }
            return app;
        });
    criticalLoadPromises.push(splineLoadPromise);

    try {
        await loaderBarPromise;
        await Promise.all(criticalLoadPromises);
        console.log("MAIN-APP: Loader bar animation and critical assets loading complete.");
    } catch (error) {
        console.error("MAIN-APP: Error during critical loading:", error);
    }

    await hideLoader({ fadeDuration: 0.5 });
    console.log("MAIN-APP: Loader hidden. Starting main content intro animations.");
    document.body.style.overflow = 'hidden';

    const comNameElement = document.querySelector(".com-name-ani");
    if (comNameElement) {
        try {
            splitComName = new SplitText(".com-name-ani", { type: "chars" });
            gsap.set(splitComName.chars, { opacity: 0 });
        } catch (e) {
            console.error("MAIN-APP: Error creating SplitText for .com-name-ani:", e);
            splitComName = null;
        }
    } else {
        console.warn("MAIN-APP: .com-name-ani element not found for splitting.");
    }

    gsap.set(".com-name-ani", { autoAlpha: 0 });
    gsap.set(".headline", { autoAlpha: 0 });

    const masterIntroTimeline = gsap.timeline();
    const currentScaleConfig = getScaleConfig();

    if (splitComName) {
        masterIntroTimeline
            .set(".com-name-ani", {
                autoAlpha: 1, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)"
            })
            .fromTo(splitComName.chars,
                { opacity: 0, y: -200 },
                { duration: .5, opacity: 1, y: 0, ease: "bounce.out", stagger: 0.3 }
            )
            .to(".com-name-ani", {
                duration: 0.8, top: "-150px", left: "0px", transform: "translate(0, 0)", fontSize: "7vw", ease: "power3.inOut"
            }, "+=1");
    }

    masterIntroTimeline
        .set(".headline", { autoAlpha: 1, xPercent: -50, left: "50%" })
        .to(".headline", {
            xPercent: 0, left: "0%", duration: 1, ease: "power2.inOut"
        }, splitComName ? "-=0.3" : "+=0.1");

    const headlineDivs = gsap.utils.toArray(".headline div");
    const characterAnimationStartTime = "<";

    headlineDivs.forEach((divElement, lineIndex) => {
        gsap.set(divElement, { autoAlpha: 1, overflow: 'hidden' });

        try {
            const lineSplit = new SplitText(divElement, { type: "chars", charsClass: "headline-char" });
            splitHeadlineChars.push(lineSplit);

            masterIntroTimeline.fromTo(lineSplit.chars,
                {
                    xPercent: 100,
                    autoAlpha: 0,
                },
                {
                    xPercent: 0,
                    autoAlpha: 1,
                    duration: 0.6,
                    stagger: 0.04,
                    ease: "circ.out",
                },
                `${characterAnimationStartTime}+=${lineIndex * 0.2}`
            );
        } catch (e) {
            console.error("MAIN-APP: Error creating SplitText for .headline div:", divElement, e);
        }
    });

    masterIntroTimeline.addLabel("headlineCharsDone", ">");

    masterIntroTimeline.to(".headline div em", {
        color: "#FFFF00", duration: 0.5, stagger: 0.1, ease: "power1.inOut"
    }, "headlineCharsDone-=0.8");

    masterIntroTimeline.call(() => {
        if (comNameElement) {
            comNameElement.style.display = "inline-block";
            comNameElement.style.whiteSpace = "nowrap";
            if (!comNameElement.querySelector('a')) {
                const logoLink = document.createElement('a');
                logoLink.href = "#";
                logoLink.style.display = "inline-block";
                logoLink.setAttribute('aria-label', 'Homepage');
                while (comNameElement.firstChild) {
                    logoLink.appendChild(comNameElement.firstChild);
                }
                comNameElement.appendChild(logoLink);
            }
        }
    });

    if (splineCanvas && winhub) {
        masterIntroTimeline
            .to(splineCanvas, { autoAlpha: 1, duration: 1 }, "-=0.5")
            .call(() => {
                if (winhub) winhub.visible = true;
            }, null, "<")
            .fromTo(winhub.scale,
                { x: responsiveScale(currentScaleConfig.hero * 0.5), y: responsiveScale(currentScaleConfig.hero * 0.5), z: responsiveScale(currentScaleConfig.hero * 0.5) },
                { x: responsiveScale(currentScaleConfig.hero), y: responsiveScale(currentScaleConfig.hero), z: responsiveScale(currentScaleConfig.hero), duration: 1.5, ease: "power3.out" },
                "<+0.2"
            )
            .fromTo(winhub.rotation,
                { x: degToRad(90), y: degToRad(-360), z: degToRad(5) },
                { x: degToRad(0), y: degToRad(90), z: degToRad(0), duration: 1.5, ease: "power3.out" },
                "<"
            )
            .fromTo(winhub.position,
                { x: 0, y: WINHUB_INTRO_END_Y, z: WINHUB_INTRO_END_Z },
                {
                    x: getTargetWinhubX(),
                    y: WINHUB_INTRO_END_Y,
                    z: WINHUB_INTRO_END_Z,
                    duration: 1.5,
                    ease: "power3.out"
                },
            "<");
    }

    masterIntroTimeline.eventCallback("onComplete", () => {
        console.log("MAIN-APP: Master intro timeline complete.");
        document.body.style.overflow = 'auto';

        if (typeof window.THREE !== 'undefined') {
            mainPageBackgroundSphere = new InteractiveBackgroundSphere('threejs-background-container', {
                sphereOffsetX: .1,
                sphereOffsetY: 0,
            });
            if (mainPageBackgroundSphere.valid && mainPageBackgroundSphere.init) {
                mainPageBackgroundSphere.init().introAnimate(
                    { from: 1.5, to: 1, duration: 2.0, ease: "power2.out", delay: 0.1 },
                    { fromY: Math.PI, toY: 0, duration: 2.5, ease: "power2.out", delay: 0.1 }
                );
            } else {
                console.warn("MAIN-APP: Background sphere initialization failed or skipped.");
            }
        } else {
            console.warn("MAIN-APP: THREE.js not loaded globally, skipping Background sphere initialization.");
        }

        setupMainPageBackgroundGradientAnimations();
        if (mainSplineApp && winhub && cable) {
            setupSplineScrollAnimations(winhub, cable);
        }
        setupBarAnimations();
        setupH1TextAnimation();
        setupComNameScrollAnimation();
        setupSubTitleAnimation();
        setupWorksHorizontalScroll();

        ScrollTrigger.refresh();
        console.log("MAIN-APP: ScrollTrigger refreshed.");

        gsap.to([".menu-icon", ".scroll-icon"], {
            duration: 0.8, autoAlpha: 1, ease: "power2.out", delay: 0.3, stagger: 0.2
        });
        console.log("MAIN-APP: Menu and scroll icons animated. Main page sequence fully complete.");
    });
}

// -----------------------------------------
// Resize Handling for Main Page
// -----------------------------------------
function handleMainPageResize() {
    console.log("MAIN-APP: Resize detected.");
    // Kill all ScrollTriggers first to prevent conflicts during re-setup
    killAllScrollTriggers(); // This is a broad approach.
    // Alternatively, kill specific groups of triggers if more granular control is needed.
    // e.g., killScrollTriggersByPattern('splineScrollTrigger-');
    // killScrollTriggersByPattern('barMorphTrigger-'); etc.

    splineTimelines.forEach(tl => tl.kill()); // Kill GSAP timelines if they hold state/animations
    splineTimelines = [];

    // Revert SplitText instances
    if (splitH1 && typeof splitH1.revert === 'function') splitH1.revert();
    if (splitSubTitles && splitSubTitles.length > 0) {
        splitSubTitles.forEach(st => { if (st && typeof st.revert === 'function') st.revert(); });
        splitSubTitles = [];
    }
    if (splitComName && typeof splitComName.revert === 'function') {
        splitComName.revert(); // Revert .com-name-ani split
    }
    if (splitHeadlineChars && splitHeadlineChars.length > 0) {
        splitHeadlineChars.forEach(splitInstance => { if (splitInstance && typeof splitInstance.revert === 'function') splitInstance.revert(); });
        splitHeadlineChars = []; // Clear the array
    }


    const currentScaleConfig = getScaleConfig(); // Recalculate scale config based on new size

    // Handle background sphere resize
    if (mainPageBackgroundSphere && mainPageBackgroundSphere._onResize) {
        mainPageBackgroundSphere._onResize();
    }

    // Re-setup animations. Order can be important.
    setupMainPageBackgroundGradientAnimations();

    // Reset Spline object to its intended "base" state before re-applying scroll animations
    if (mainSplineApp && winhub && cable) {
        // Example: Reset to a state similar to after intro, before scroll animations take over
        // This depends on what state is expected before scroll animations are re-applied.
        // Often, it's the state at scroll position 0 or the end of the intro.
        gsap.set(winhub.scale, {
            x: responsiveScale(currentScaleConfig.hero),
            y: responsiveScale(currentScaleConfig.hero),
            z: responsiveScale(currentScaleConfig.hero)
        });
        gsap.set(winhub.rotation, { x: degToRad(0), y: degToRad(90), z: degToRad(0) });
        gsap.set(winhub.position, {
            x: getTargetWinhubX(),
            y: WINHUB_INTRO_END_Y,
            z: WINHUB_INTRO_END_Z
        });

        // Determine cable visibility based on current scroll position (simplified)
        if (ScrollTrigger.isInViewport("#hero") && (!document.querySelector("#part1") || !ScrollTrigger.isInViewport("#part1"))) {
            if (cable) cable.visible = false;
        } else {
             // This logic might need to be more robust, checking which section is active
            if (cable) cable.visible = true; // Default to true if not in hero and part1 exists
        }
        setupSplineScrollAnimations(winhub, cable);
    }

    setupBarAnimations();
    setupH1TextAnimation(); // Re-split and set up triggers
    setupSubTitleAnimation(); // Re-split and set up triggers
    setupComNameScrollAnimation();
    setupWorksHorizontalScroll();

    // Crucially, refresh all ScrollTriggers after re-adding them and DOM changes settle
    ScrollTrigger.refresh(true); // true forces a hard refresh
    console.log("MAIN-APP: Animations and ScrollTriggers refreshed after resize.");
}

// --- DOMContentLoaded Listener for Main Page ---
document.addEventListener("DOMContentLoaded", () => {
    console.log("MAIN-APP: DOMContentLoaded event fired.");
    setupScrollRestoration();
    setupMenu("menu-toggle", "menu-overlay", "menu-close", ".menu-links .top-link a");
    setupMenuLinkEffects();
    console.log("MAIN-APP: Basic setup complete (scroll restoration, menu toggle and effects).");

    runMainPageSequence().catch(error => {
        console.error("MAIN-APP: Error during main page animation sequence:", error);
        hideLoader().finally(() => {
            document.body.style.overflow = 'auto';
        });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleMainPageResize, 250); // Debounce resize handling
    });
});
