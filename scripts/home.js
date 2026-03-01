console.log('home.js carregado - Liber Occultorum version');
const conceptCards = [
    {
        icon: 'fa-mask',
        title: 'Mitologia Viva',
        text: 'Deuses, heróis e monstros como arquétipos que ainda falam dentro de nós.'
    },
    {
        icon: 'fa-arrow-trend-up',
        title: 'Filosofia Perene',
        text: 'Hermetismo, neoplatonismo, cabala – ideias que atravessam séculos.'
    },
    {
        icon: 'fa-wand-sparkles',
        title: 'Prática Simbólica',
        text: 'Tarot, astrologia, alquimia – ferramentas para dialogar com o inconsciente.'
    },
    {
        icon: 'fa-dragon',
        title: 'Imaginário Coletivo',
        text: 'Contos, lendas e folclore – a sabedoria que o povo preserva.'
    },
    {
        icon: 'fa-tree',
        title: 'Cosmologias',
        text: 'Visões de mundo, criação e destino – o universo como símbolo.'
    },
    {
        icon: 'fa-hand-sparkles',
        title: 'Ritual e Intenção',
        text: 'Ações simbólicas que transformam a percepção e o entorno.'
    },
    {
        icon: 'fa-person-walking',
        title: 'A Jornada do Louco',
        text: 'Os 22 arcanos maiores como uma viagem de autoconhecimento, da inocência à iluminação.'
    },
    {
        icon: 'fa-brain',
        title: 'Arquétipos e Inconsciente',
        text: 'Jung, sombra, persona e os símbolos universais que habitam a psique.'
    },
    {
        icon: 'fa-greek-temple',
        title: 'Deuses nos Arcanos',
        text: 'Zeus, Hades, Atena, Apolo – as divindades clássicas escondidas nas lâminas.'
    },
    {
        icon: 'fa-cross',
        title: 'Cristianismo e Salvação',
        text: 'Pecado, virtudes e redenção na iconografia medieval do tarot.'
    },
    {
        icon: 'fa-circle-radiation',
        title: 'Roda da Fortuna',
        text: 'Destino, acaso e a filosofia antiga sobre os ciclos da vida.'
    },
    {
        icon: 'fa-star-and-crescent',
        title: 'Alta Magia e Cabala',
        text: 'A árvore da vida, os quatro mundos e a magia cerimonial.'
    },
    {
        icon: 'fa-hat-wizard',
        title: 'Goetia e os 72 Espíritos',
        text: 'Os demônios do Rei Salomão e suas correspondências com os arcanos menores.'
    },
    {
        icon: 'fa-book-open',
        title: 'Leitura Intuitiva',
        text: 'Abordagens narrativas, hermenêutica visual e ética na prática do tarot.'
    },
    {
        icon: 'fa-scroll',
        title: 'Gnose e a Centelha Divina',
        text: 'A alma aprisionada, o demiurgo e o conhecimento que liberta.'
    },
    {
        icon: 'fa-skull',
        title: 'O Corpo como Prisão',
        text: 'Visões gnósticas sobre a carne, ascetismo e transcendência.'
    }
];
function initHomePage() {
    console.log('Inicializando página Home...');
    buildConceptCarousel();
    setupNavigationLinks();
    loadTipsFromJSON();
}
function buildConceptCarousel() {
    const track = document.querySelector('.carousel-track');
    const dotsContainer = document.querySelector('.carousel-dots');
    if (!track) return;
    track.innerHTML = '';
    dotsContainer.innerHTML = '';
    conceptCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'carousel-card';
        cardDiv.innerHTML = `
            <div class="carousel-icon">
                <i class="fas ${card.icon}"></i>
            </div>
            <h3>${card.title}</h3>
            <p>${card.text}</p>
        `;
        track.appendChild(cardDiv);
    });
    const cards = document.querySelectorAll('.carousel-card');
    const totalCards = cards.length;
    const cardsPerView = 3;
    let currentIndex = 0;
    const totalGroups = Math.ceil(totalCards / cardsPerView);
    for (let i = 0; i < totalGroups; i++) {
        const dot = document.createElement('span');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', () => {
            goToGroup(i);
        });
        dotsContainer.appendChild(dot);
    }
    const leftArrow = document.querySelector('.carousel-arrow-left');
    const rightArrow = document.querySelector('.carousel-arrow-right');
    const dots = document.querySelectorAll('.carousel-dot');
    function goToGroup(groupIndex) {
        if (groupIndex < 0) groupIndex = 0;
        if (groupIndex >= totalGroups) groupIndex = totalGroups - 1;
        const translateX = -groupIndex * 100; 
        track.style.transform = `translateX(${translateX}%)`;
        currentIndex = groupIndex;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
    leftArrow.addEventListener('click', () => {
        goToGroup(currentIndex - 1);
    });
    rightArrow.addEventListener('click', () => {
        goToGroup(currentIndex + 1);
    });
    goToGroup(0);
}
function setupNavigationLinks() {
    console.log('Configurando links de navegação...');
    document.addEventListener('click', function(e) {
        const pathCard = e.target.closest('.path-card');
        if (!pathCard) return;
        e.preventDefault();
        pathCard.style.transform = 'scale(0.98)';
        setTimeout(() => {
            pathCard.style.transform = '';
        }, 200);
        const path = pathCard.getAttribute('data-path');
        console.log(`Path clicado: ${path}`);
        if (typeof window.loadPage === 'function') {
            window.loadPage(path);
            if (typeof window.setActiveNavLink === 'function') {
                window.setActiveNavLink(path);
            }
        } else {
            console.error('loadPage não encontrada');
        }
    });
}
async function loadTipsFromJSON() {
    try {
        const response = await fetch('/files/dicas.json');
        if (!response.ok) throw new Error('Erro ao carregar dicas');
        const tips = await response.json();
        console.log(`${tips.length} dicas carregadas`);
        buildTipsSlider(tips);
    } catch (error) {
        console.error('Falha ao carregar dicas:', error);
        const fallbackTips = [
            {
                category: "Estudo",
                date: "Hoje",
                title: "Como começar sem se perder",
                text: "Escolha UM mito ou uma tradição. Leia diferentes versões. Depois, pergunte-se: o que isso me diz sobre mim?",
                tag: "#iniciantes"
            },
            {
                category: "Interpretação",
                date: "Esta semana",
                title: "Símbolos não são dicionários",
                text: "Um símbolo não tem um significado único. Ele é um feixe de possibilidades.",
                tag: "#simbolismo"
            }
        ];
        buildTipsSlider(fallbackTips);
    }
}
function buildTipsSlider(tips) {
    const sliderContainer = document.querySelector('.tip-slider');
    if (!sliderContainer) return;
    sliderContainer.innerHTML = '';
    tips.forEach((tip, index) => {
        const card = document.createElement('div');
        card.className = `tip-card ${index === 0 ? 'active' : ''}`;
        card.innerHTML = `
            <div class="tip-header">
                <span class="tip-category">${tip.category}</span>
                <span class="tip-date">${tip.date}</span>
            </div>
            <h3>${tip.title}</h3>
            <p>${tip.text}</p>
            <div class="tip-footer">
                <span class="tip-tag">${tip.tag}</span>
            </div>
        `;
        sliderContainer.appendChild(card);
    });
    initTipsSlider();
}
function initTipsSlider() {
    const tipCards = document.querySelectorAll('.tip-card');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (tipCards.length === 0) return;
    let currentIndex = 0;
    let autoRotateInterval;
    function showTip(index) {
        if (index < 0) index = tipCards.length - 1;
        if (index >= tipCards.length) index = 0;
        tipCards.forEach(card => {
            card.classList.remove('active');
            card.style.display = 'none';
        });
        tipCards[index].classList.add('active');
        tipCards[index].style.display = 'block';
        currentIndex = index;
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showTip(currentIndex - 1);
            resetAutoRotate();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showTip(currentIndex + 1);
            resetAutoRotate();
        });
    }
    function startAutoRotate() {
        if (autoRotateInterval) clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(() => {
            showTip(currentIndex + 1);
        }, 20000); 
    }
    function resetAutoRotate() {
        startAutoRotate();
    }
    showTip(0);
    startAutoRotate();
    window.addEventListener('beforeunload', () => {
        if (autoRotateInterval) clearInterval(autoRotateInterval);
    });
}
function initTipsSliderFromArray(totalTips) {
    const tipCards = document.querySelectorAll('.tip-card');
    const tipDots = document.querySelectorAll('.tip-dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (tipCards.length === 0) return;
    let currentIndex = 0;
    let autoRotateInterval;
    function showTip(index) {
        if (index < 0) index = tipCards.length - 1;
        if (index >= tipCards.length) index = 0;
        tipCards.forEach(card => {
            card.classList.remove('active');
            card.style.display = 'none';
        });
        tipDots.forEach(dot => dot.classList.remove('active'));
        tipCards[index].classList.add('active');
        tipCards[index].style.display = 'block';
        if (tipDots[index]) tipDots[index].classList.add('active');
        currentIndex = index;
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showTip(currentIndex - 1);
            resetAutoRotate();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showTip(currentIndex + 1);
            resetAutoRotate();
        });
    }
    tipDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showTip(index);
            resetAutoRotate();
        });
    });
    function startAutoRotate() {
        if (autoRotateInterval) clearInterval(autoRotateInterval);
        autoRotateInterval = setInterval(() => {
            showTip(currentIndex + 1);
        }, 6000); 
    }
    function resetAutoRotate() {
        startAutoRotate();
    }
    showTip(0);
    startAutoRotate();
    window.addEventListener('beforeunload', () => {
        if (autoRotateInterval) clearInterval(autoRotateInterval);
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}
window.initHomePage = initHomePage;