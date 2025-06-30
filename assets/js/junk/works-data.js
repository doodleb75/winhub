// assets/js/works-data.js

// 프로젝트 데이터. 이 파일을 수정하여 프로젝트 내용을 관리합니다.
// export 하여 다른 모듈에서 import 할 수 있도록 합니다.
export const portfolioItemsData = [
    { 
        id: 1, 
        category: 'web', 
        title: 'SKT Open2U 구매 시스템', 
        client: 'SKT', 
        date: '2024.01', 
        scope: 'UX/UI, GUI', 
        skill: 'Figma, Adobe CC', 
        overview: '동반 성장을 추구하는 SKT의 Open2U 구매 시스템은 파트너사와의 상생을 목표로 설계되었습니다. 복잡했던 구매 프로세스를 간소화하고 투명성을 높여 모든 사용자가 만족할 수 있는 경험을 제공합니다.',
        strategy: '사용자 그룹(파트너사, 내부 구매팀)을 세분화하여 각 그룹에 최적화된 워크플로우를 제공했습니다. 직관적인 UI와 명확한 가이드라인을 통해 신규 사용자도 쉽게 적응할 수 있도록 설계했습니다.',
        design: '신뢰감을 주는 SKT의 브랜드 컬러를 사용하여 일관성을 유지하고, 중요한 정보에 집중할 수 있도록 미니멀한 디자인을 적용했습니다. 데이터 시각화를 통해 복잡한 데이터를 쉽게 파악하도록 돕습니다.',
        images: {
            hero: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1920&auto=format&fit=crop',
            overview: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1920&auto=format&fit=crop',
            strategy: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1920&auto=format&fit=crop',
            design: 'https://images.unsplash.com/photo-1587614295999-6c1c13675123?q=80&w=1920&auto=format&fit=crop'
        }
    },
    { 
        id: 2, 
        category: 'mobile', 
        title: 'KT 마이케어', 
        client: 'KT', 
        date: '2023.11', 
        scope: 'UX/UI, GUI', 
        skill: 'Figma, Lottie',
        overview: '나의 맞춤 건강 관리 코디네이터, KT 마이케어는 사용자의 건강 데이터를 기반으로 개인화된 헬스케어 서비스를 제공하는 모바일 앱입니다. 건강검진 결과, 라이프로그 등을 통합 관리합니다.',
        strategy: '게임화(Gamification) 요소를 도입하여 사용자가 재미있게 건강 관리를 지속할 수 있도록 유도했습니다. 가족의 건강을 함께 관리하는 기능을 추가하여 서비스 사용 범위를 확장했습니다.',
        design: '따뜻하고 친근한 컬러와 일러스트레이션을 사용하여 사용자에게 편안함을 제공합니다. 복잡한 건강 데이터를 이해하기 쉬운 차트와 그래프로 시각화하여 정보 전달력을 높였습니다.',
        images: {
            hero: 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1920&auto=format&fit=crop',
            overview: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1920&auto=format&fit=crop',
            strategy: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1920&auto=format&fit=crop',
            design: 'https://images.unsplash.com/photo-1620912189895-1f65529541a9?q=80&w=1920&auto=format&fit=crop'
        }
    },
    { 
        id: 3, 
        category: 'web', 
        title: '장식재 통합관리 시스템', 
        client: 'LX Hausys', 
        date: '2023.06', 
        scope: 'UX/UI, GUI Design', 
        skill: 'Figma, Adobe CC',
        overview: 'LX Hausys의 장식재 통합관리 시스템은 복잡한 자재 정보와 재고 현황, 발주 프로세스를 디지털화하여 업무 효율성을 극대화하기 위해 기획되었습니다. 다양한 사용자들이 자신의 역할에 맞는 정보에 쉽고 빠르게 접근할 수 있는 직관적인 UX/UI를 제공하는 것을 목표로 했습니다.',
        strategy: '사용자 리서치를 통해 각 부서의 핵심 과업과 정보 요구사항을 파악하고, 이를 바탕으로 개인화된 대시보드와 강력한 검색 필터 기능을 설계했습니다. 데이터 시각화를 통해 복잡한 재고 및 판매 데이터를 한눈에 파악할 수 있도록 하고, 반응형 디자인을 적용하여 언제 어디서든 업무를 처리할 수 있도록 지원했습니다.',
        design: '신뢰감과 전문성을 전달하는 블루 톤을 메인 컬러로 사용하고, 정보의 중요도에 따라 컬러와 타이포그래피에 명확한 위계를 설정했습니다. 복잡한 표 데이터를 쉽게 인지할 수 있도록 행과 열의 구분을 명확히 하고, 일관된 디자인 시스템을 구축하여 서비스 전체의 통일성을 확보했습니다.',
        images: {
            hero: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1920&auto=format&fit=crop',
            overview: 'https://images.unsplash.com/photo-1516131206008-dd041a372dd4?q=80&w=1920&auto=format&fit=crop',
            strategy: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1920&auto=format&fit=crop',
            design: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1920&auto=format&fit=crop'
        }
    },
];
