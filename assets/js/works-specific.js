// ../assets/js/works-specific.js

import { worksData } from './works-data.js';

// 페이지 로드 및 pageshow (뒤로가기/앞으로가기 캐시) 시 호출될 메인 초기화 함수
window.addEventListener('load', initializePortfolio);
window.addEventListener('pageshow', function(event) {
    // 페이지가 브라우저의 BFcache에서 복원되었는지 확인
    if (event.persisted) {
        initializePortfolio(); // 메인 초기화 함수를 다시 실행하여 애니메이션 재생
    }
});

function initializePortfolio() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    // [수정] 기존 로컬 데이터 대신 import한 worksData를 사용합니다.
    const portfolioItemsData = worksData;

    const portfolioGrid = document.getElementById('portfolio-grid');
    const filterButtons = document.querySelectorAll('.filter-button');

    function renderPortfolioItems(filter = 'all') {
        if (!portfolioGrid) {
            return;
        }
        portfolioGrid.innerHTML = ''; // 기존 아이템을 지웁니다.
        const filteredItems = filter === 'all'
            ? portfolioItemsData
            : portfolioItemsData.filter(item => item.category === filter);

        filteredItems.forEach(item => {
            const itemElement = document.createElement('a');
            itemElement.className = 'portfolio-item transition-link';
            // 프로젝트의 고유 ID로 상세 페이지 템플릿에 링크
            itemElement.href = `page/works_details/works-detail.html?id=${item.id}`; 
            itemElement.dataset.category = item.category;

            itemElement.innerHTML = `
                <img src="${item.listImage}" alt="${item.title} 프로젝트 이미지" class="portfolio-item-img" onerror="this.onerror=null;this.src='https://placehold.co/800x600/cccccc/ffffff?text=Image+Not+Found';">
                <div class="thumbnail-overlay">
                    <div class="thumbnail-text">
                        <h3>${item.title}</h3>
                        <p>${item.client}</p>
                    </div>
                    <div class="view-prompt">VIEW <span>&rarr;</span></div>
                </div>
            `;
            portfolioGrid.appendChild(itemElement);
        });
        applyScrollAnimations(); // 새로 렌더링된 아이템에 애니메이션 적용
    }

    function applyScrollAnimations() {
        const items = gsap.utils.toArray('.portfolio-item');
        
        // 포트폴리오 아이템 또는 그리드와 관련된 기존 ScrollTrigger 인스턴스들을 제거합니다.
        ScrollTrigger.getAll().forEach(trigger => {
             if (trigger.vars.trigger && (trigger.vars.trigger === portfolioGrid || items.includes(trigger.vars.trigger))) {
                trigger.kill();
            }
        });

        // 모든 아이템의 초기 상태를 설정합니다 (숨겨진 상태).
        gsap.set(items, { opacity: 0, y: -50, scaleY: 0, transformOrigin: 'top center' });

        // 애니메이션 타임라인을 생성하고 초기에는 일시 정지 상태로 둡니다.
        const animationTimeline = gsap.timeline({ paused: true }); 
        animationTimeline.to(items, {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.3, // 각 아이템이 0.3초 간격으로 순차적으로 나타나도록 설정
        });

        // ScrollTrigger를 생성하여 애니메이션 타임라인을 제어합니다.
        ScrollTrigger.create({
            trigger: portfolioGrid, // 그리드 전체가 뷰포트에 들어올 때 애니메이션 트리거
            start: 'top 90%', // 그리드 상단이 뷰포트의 90% 지점에 도달할 때
            onEnter: () => animationTimeline.restart(true), // true를 추가하여 즉시 시작 지점으로 이동 후 재생
            onLeave: () => animationTimeline.reverse(), // 스크롤을 아래로 내려 트리거 영역을 벗어날 때
            onEnterBack: () => animationTimeline.restart(true), // 스크롤을 위로 올려 트리거 영역으로 다시 들어올 때
            onLeaveBack: () => animationTimeline.reverse() // 스크롤을 위로 올려 트리거 영역을 벗어날 때
        });
        
        // 페이지 로드 또는 BFcache 복원 시 그리드가 이미 뷰포트에 보이는 경우 애니메이션을 즉시 재생합니다.
        const rect = portfolioGrid.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            // 애니메이션이 아직 재생되지 않았거나 완전히 끝나지 않은 상태라면 재생
            if (animationTimeline.progress() === 0 || animationTimeline.reversed()) { 
                animationTimeline.play();
            }
        }
    }
    
    // 필터 버튼 로직
    if (filterButtons.length > 0 && portfolioGrid) {
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); 
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const filterValue = button.dataset.filter;

                // 필터링 전에 기존 ScrollTrigger 인스턴스들을 제거합니다.
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.getAll().forEach(trigger => {
                         if (trigger.vars.trigger && (trigger.vars.trigger === portfolioGrid || trigger.vars.trigger.classList.contains('portfolio-item'))) {
                            trigger.kill();
                        }
                    });
                }
                
                // 아이템이 사라지는 애니메이션
                const tl = gsap.timeline();
                tl.to('.portfolio-item', {
                    opacity: 0,
                    y: -20, // 사라질 때 위로 움직이도록 유지
                    scaleY: 0, // 사라질 때 Y 스케일을 0으로 만들어 블라인드처럼 닫히도록 함
                    transformOrigin: 'top center', // 위에서 아래로 닫히는 느낌을 주도록 transformOrigin 설정
                    duration: 0.3,
                    stagger: 0.05, // 사라질 때도 staggered 효과 적용
                    onComplete: () => {
                        renderPortfolioItems(filterValue); // 애니메이션 완료 후 필터링된 아이템 렌더링
                    }
                });
            });
        });
    }

    renderPortfolioItems(); // 초기 포트폴리오 아이템 렌더링
}
