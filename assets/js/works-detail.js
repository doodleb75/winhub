// assets/js/works-detail.js

import * as THREE_MOD from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
window.THREE = THREE_MOD;

import { ScrollToPlugin } from "https://esm.sh/gsap/ScrollToPlugin";
import { SplitText } from "https://esm.sh/gsap/SplitText";
import {
    setupScrollRestoration,
    runLoaderSequence,
    killAllScrollTriggers,
    loadCommonUI,
} from './common-utils.js';
import { worksData } from './works-data.js';

if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollToPlugin, SplitText);
}

// --- Global Variables ---
let subpageBodyElement = null;
let heroSection = null;

const heroAreaConfig = {
    bodyBackgroundColor: "#0e2059",
    gnbTextColor: "#2c3e50",
};

const scrolledPastConfig = {
    bodyBackgroundColor: "#f0f0f0",
    gnbTextColor: "#fdfefe",
};


/**
 * Renders project details based on the ID from the URL.
 */
function renderProjectDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) {
        if(heroSection) heroSection.innerHTML = "<h1>Project Not Found.</h1>";
        return;
    }
    const project = worksData.find(p => p.id === projectId);
    if (!project) {
        if(heroSection) heroSection.innerHTML = `<h1>Project '${projectId}' Not Found.</h1>`;
        return;
    }

    document.title = `WINHUB - WORKS - ${project.title}`;
    document.querySelector('.project-title').textContent = project.title;
    document.querySelector('.project-meta dl:nth-of-type(1) dd').textContent = project.date;
    document.querySelector('.project-meta dl:nth-of-type(2) dd').textContent = project.client;
    document.querySelector('.project-meta dl:nth-of-type(3) dd').textContent = project.service;
    document.querySelector('.project-overview p').textContent = project.overview;
    const showcaseImage = document.querySelector('.showcase-image');
    showcaseImage.src = project.mainImage;
    showcaseImage.alt = `${project.title} Showcase Image`;

    setupProjectNavigation(projectId);
}

/**
 * Sets up the initial visual state of the page.
 */
function initialPageVisualSetup() {
    subpageBodyElement = document.querySelector('.subpage-body');
    heroSection = document.getElementById("sub-hero");

    gsap.set(subpageBodyElement, { backgroundColor: heroAreaConfig.bodyBackgroundColor });
    gsap.set([".com-name-logo", ".menu-icon"], { color: heroAreaConfig.gnbTextColor });
    gsap.set([".com-name-logo", ".menu-icon", ".scroll-icon"], { autoAlpha: 0 });
    gsap.set("#project-navigation", { autoAlpha: 0, y: 20 });
}


/**
 * [MODIFIED] Animates the appearance of detail content, showing the showcase image first.
 */
function animateDetailContent() {
    const title = document.querySelector('.project-title');
    const metaItems = gsap.utils.toArray('.project-meta dl');
    const overviewTitle = document.querySelector('.project-overview h3');
    const overviewText = document.querySelector('.project-overview p');
    const showcaseSection = document.getElementById('project-showcase');
    const heroSection = document.getElementById('sub-hero');

    if (!heroSection || !showcaseSection) {
        if(heroSection) gsap.set(heroSection, { autoAlpha: 1 });
        if(showcaseSection) gsap.set(showcaseSection, { autoAlpha: 1 });
        return;
    }

    // Set initial states to hidden
    gsap.set([heroSection, showcaseSection], { autoAlpha: 0 });
    // Also hide the inner content to prevent a flash
    gsap.set([title, '.project-meta', '.project-overview'], { autoAlpha: 0 });

    const tl = gsap.timeline();

    // 1. Animate the main image showcase to appear first.
    tl.to(showcaseSection, {
        autoAlpha: 1,
        duration: 1.0,
        ease: "power3.out"
    });

    // 2. After the image, fade in the entire hero section.
    tl.to(heroSection, {
        autoAlpha: 1,
        duration: 0.8,
        ease: "power2.inOut"
    }, "-=0.5"); // Overlap for a smoother transition

    // 3. Animate the text content within the hero section as it appears.
    const textTl = gsap.timeline();

    if (title) {
        const splitTitle = new SplitText(title, { type: "chars, words" });
        gsap.set(title, { autoAlpha: 1 }); // Make container visible before animating chars
        textTl.from(splitTitle.chars, {
            opacity: 0,
            y: 20,
            ease: "back.out(1.7)",
            stagger: 0.02,
            duration: 0.4
        });
    }

    if (metaItems.length > 0) {
        gsap.set(document.querySelector('.project-meta'), { autoAlpha: 1 });
        textTl.from(metaItems, {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.4,
            ease: "power2.out"
        }, "-=0.2");
    }

    if (overviewTitle && overviewText) {
        const splitOverview = new SplitText(overviewText, { type: "lines" });
        gsap.set(document.querySelector('.project-overview'), { autoAlpha: 1 });
        textTl.from(overviewTitle, { 
            opacity: 0, y: 20, duration: 0.4, ease: "power2.out" 
        }, "-=0.2")
          .from(splitOverview.lines, {
            opacity: 0,
            y: 20,
            stagger: 0.1,
            duration: 0.5,
            ease: "power2.out"
        }, ">-0.2");
    }

    // Add the text animations to the main timeline, starting as the hero fades in.
    tl.add(textTl, "<0.3");
}

/**
 * Switches colors based on scroll position.
 */
function switchColors(isScrolledPast) {
    const gnbElements = gsap.utils.toArray(".com-name-logo, .menu-icon");
    const targetConfig = isScrolledPast ? scrolledPastConfig : heroAreaConfig;
    const duration = 0.5;
    
    gsap.to(subpageBodyElement, {
        backgroundColor: targetConfig.bodyBackgroundColor,
        duration: duration,
        ease: 'power2.inOut'
    });

    gsap.to(gnbElements, {
        color: targetConfig.gnbTextColor,
        duration: duration,
        ease: 'power2.inOut'
    });
    
    if (isScrolledPast) {
        subpageBodyElement.classList.add('scrolled-past-hero-colors');
    } else {
        subpageBodyElement.classList.remove('scrolled-past-hero-colors');
    }
}

/**
 * Sets up the ScrollTrigger for color switching.
 */
function setupColorSwitcher() {
    if (!heroSection || typeof ScrollTrigger === 'undefined') return;
    
    // [원복] 코드를 원래의 트리거 로직으로 되돌립니다.
    ScrollTrigger.create({
        trigger: heroSection,
        start: "bottom 30%", 
        onEnter: () => switchColors(true),
        onLeaveBack: () => switchColors(false),
        invalidateOnRefresh: true,
    });
}

/**
 * Sets up the 'Scroll to Top' button.
 */
function setupScrollToTopButton() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const heroSection = document.getElementById('sub-hero');

    if (!scrollToTopBtn || !heroSection) {
        return;
    }
    
    const existingTrigger = ScrollTrigger.getById("scrollToTopBtnTrigger");
    if (existingTrigger) existingTrigger.kill();

    ScrollTrigger.create({
        id: "scrollToTopBtnTrigger",
        trigger: heroSection,
        start: "bottom top",
        onEnter: () => {
            if (!scrollToTopBtn.classList.contains('show')) {
                gsap.to(scrollToTopBtn, { autoAlpha: 1, duration: 0.3, onComplete: () => scrollToTopBtn.classList.add('show') });
            }
        },
        onLeaveBack: () => {
            if (scrollToTopBtn.classList.contains('show')) {
                gsap.to(scrollToTopBtn, { autoAlpha: 0, duration: 0.3, onComplete: () => scrollToTopBtn.classList.remove('show') });
            }
        },
        invalidateOnRefresh: true,
    });

    scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/**
 * Sets up navigation links to previous/next projects.
 * @param {string} currentProjectId - The ID of the current project.
 */
function setupProjectNavigation(currentProjectId) {
    const prevProjectLink = document.querySelector('.prev-project');
    const nextProjectLink = document.querySelector('.next-project');
    const currentIndex = worksData.findIndex(p => p.id === currentProjectId);

    if (prevProjectLink) {
        if (currentIndex > 0) {
            const prevProject = worksData[currentIndex - 1];
            prevProjectLink.href = `page/works_details/works-detail.html?id=${prevProject.id}`;
            prevProjectLink.style.pointerEvents = 'auto';
            prevProjectLink.style.opacity = '1';
        } else {
            prevProjectLink.href = "#";
            prevProjectLink.style.pointerEvents = 'none';
            prevProjectLink.style.opacity = '0.5';
        }
    }

    if (nextProjectLink) {
        if (currentIndex < worksData.length - 1) {
            const nextProject = worksData[currentIndex + 1];
            nextProjectLink.href = `page/works_details/works-detail.html?id=${nextProject.id}`;
            nextProjectLink.style.pointerEvents = 'auto';
            nextProjectLink.style.opacity = '1';
        } else {
            nextProjectLink.href = "#";
            nextProjectLink.style.pointerEvents = 'none';
            nextProjectLink.style.opacity = '0.5';
        }
    }
}


/**
 * Main function to initialize the detail page.
 */
async function initializeDetailPage() {
    renderProjectDetails();
    initialPageVisualSetup();

    try {
        await runLoaderSequence('.subpage-container');
    } catch (error) {
        console.warn("WORKS-DETAIL: Loader sequence failed, continuing...", error.message);
        const mainContent = document.querySelector('.subpage-container');
        if (mainContent) gsap.set(mainContent, {opacity: 1, visibility: 'visible'});
    }

    animateDetailContent();
    gsap.to([".com-name-logo", ".menu-icon", ".scroll-icon"], { autoAlpha: 1, duration: 0.5, stagger: 0.2 });
    gsap.to("#project-navigation", { 
        autoAlpha: 1, 
        y: 0, 
        duration: 0.8, 
        ease: 'power2.out', 
        delay: 0.4
    });

    setupColorSwitcher();
    setupScrollToTopButton(); 

    window.scrollTo(0, 0);
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // [새로운 해결책] 터치 기기에서 스크롤 동작을 정규화하여 뷰포트 변화 문제를 해결합니다.
    // 모바일 브라우저에서 주소창이 사라지고 나타날 때 발생하는 스크롤 계산 오류를 방지합니다.
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.isTouch) {
        ScrollTrigger.normalizeScroll(true);
    }

    setupScrollRestoration();
    
    try {
        await loadCommonUI();
        await initializeDetailPage();
    } catch (error) {
        console.error("WORKS-DETAIL: Page initialization failed:", error);
        const loader = document.getElementById('loader');
        if (loader) gsap.to(loader, { autoAlpha: 0 });
        const mainContent = document.querySelector('.subpage-container');
        if(mainContent) gsap.set(mainContent, {autoAlpha: 1});
        document.body.style.overflow = 'auto';
    }

    if (typeof ScrollTrigger !== 'undefined') {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            // 리사이즈 시 기존 트리거를 모두 제거하고 새로 설정합니다.
            killAllScrollTriggers(); 
            setupColorSwitcher();
            setupScrollToTopButton();
            resizeTimer = setTimeout(() => ScrollTrigger.refresh(true), 250);
        });
    }
});
