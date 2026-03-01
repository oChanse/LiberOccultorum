if (window.estudosInitialized) {
    if (typeof window.estudosCleanup === 'function') {
        window.estudosCleanup();
    }
}
window.estudosInitialized = false;
function iniciarSistemaEstudos() {
    if (window.estudosInitialized) return;
    console.log('Iniciando Biblioteca Oculta...');
    window.estudosInitialized = true;
    const bibliotecaContainer = document.getElementById('bibliotecaContainer');
    const categoriasGrid = document.getElementById('categoriasGrid');
    const estudoVisualizacao = document.getElementById('estudoVisualizacao');
    const estudoWrapper = document.getElementById('estudoWrapper');
    const btnVoltar = document.getElementById('btnVoltar');
    const searchInput = document.getElementById('searchStudies');
    const globalProgressFill = document.getElementById('globalProgressFill');
    const globalProgressText = document.getElementById('globalProgressText');
    const navPrev = document.getElementById('navPrev');
    const navNext = document.getElementById('navNext');
    const navIndicator = document.getElementById('navIndicator');
    if (!categoriasGrid || !estudoVisualizacao || !estudoWrapper) {
        console.error('Elementos da Biblioteca não encontrados!');
        return;
    }
    const estudosState = {
        allStudies: [],
        filteredStudies: [],
        categories: [],
        currentStudyId: null,
        currentFilter: 'all',
        searchTerm: '',
        studyProgress: JSON.parse(localStorage.getItem('tarot_studies_progress')) || {},
        favoriteStudies: JSON.parse(localStorage.getItem('tarot_studies_favorites')) || [],
        studyHistory: JSON.parse(localStorage.getItem('tarot_studies_history')) || [],
        expandedCategories: JSON.parse(localStorage.getItem('expanded_categories')) || {},
        currentStudyCSS: null,
        eventListeners: []
    };
    function addTrackedListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
            estudosState.eventListeners.push({ element, event, handler });
        }
    }
    async function init() {
        try {
            injectGlobalStyles();
            console.log('Carregando dados...');
            await loadStudiesData();
            console.log(`${estudosState.allStudies.length} estudos carregados`);
            setupEventListeners();
            renderCategoriasGrid();
            updateGlobalProgress();
            console.log('Biblioteca Oculta iniciada!');
        } catch (error) {
            console.error('Erro ao carregar estudos:', error);
            showError('Erro ao carregar a biblioteca', error);
        }
    }
    function injectGlobalStyles() {
        if (document.getElementById('biblioteca-global-styles')) return;
        const style = document.createElement('style');
        style.id = 'biblioteca-global-styles';
        style.textContent = `
            .biblioteca-notification {
                position: fixed; top: 20px; right: 20px;
                background: var(--bg-card, #1e1e1e);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                transform: translateX(100px); opacity: 0;
                transition: all 0.3s ease;
                color: white;
            }
            .biblioteca-notification.show { transform: translateX(0); opacity: 1; }
            .notification-content { display: flex; align-items: center; gap: 12px; padding: 15px 20px; }
            .notification-content i { font-size: 1.2rem; }
            .notification-content i.fa-check-circle { color: #4caf50; }
            .notification-content i.fa-star { color: #ffd700; }
            .hidden { display: none !important; }
            .categoria-card.minimized .categoria-header {
                opacity: 0.7;
                background: var(--bg-elevated, #1e1e1e);
                border-bottom-color: transparent !important;
            }
            .categoria-card.minimized .categoria-header:hover {
                opacity: 1;
            }
            .estudo-card .card-titulo {
                margin: 0;
                font-size: 0.95rem;
                font-weight: 500;
                color: var(--text-color, #e0e0e0);
                line-height: 1.4;
                word-break: break-word;
                overflow-wrap: break-word;
                flex: 1;
            }
            .estudo-card {
                height: auto;
                min-height: 100px;
                padding: 0.75rem 1rem;
            }
            .estudo-visualizacao.fullscreen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10000;
                background: var(--bg-paper, #1a1a1a);
                padding: 2rem;
                margin: 0;
                border-radius: 0;
                overflow-y: auto;
            }
            .estudo-visualizacao.fullscreen .estudo-wrapper {
                max-height: calc(100vh - 120px);
            }
        `;
        document.head.appendChild(style);
    }
    async function loadStudiesData() {
        try {
            const response = await fetch('files/estudos.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!data.studies || !data.categories) throw new Error('JSON inválido');
            estudosState.categories = data.categories;
            estudosState.allStudies = data.studies.map(study => ({
                ...study,
                isCompleted: !!estudosState.studyProgress[study.id],
                isFavorite: estudosState.favoriteStudies.includes(study.id),
                categoryData: estudosState.categories.find(c => c.id === study.category) || estudosState.categories[0],
                readingTime: study.estimatedReadingTime || calculateReadingTime(study.content)
            }));
            estudosState.filteredStudies = [...estudosState.allStudies];
            estudosState.categories.forEach(cat => {
                if (estudosState.expandedCategories[cat.id] === undefined) {
                    estudosState.expandedCategories[cat.id] = false; 
                }
            });
        } catch (error) {
            console.error('Erro ao carregar JSON, usando dados de exemplo');
            loadExampleData();
        }
    }
    function loadExampleData() {
        estudosState.categories = [
            { id: "classico", name: "Clássico & Mitológico", color: "#8B4513", icon: "fas fa-landmark" },
            { id: "psico", name: "Psicológico (Jung)", color: "#4B0082", icon: "fas fa-brain" }
        ];
        estudosState.allStudies = [
            {
                id: "ex1", category: "classico", title: "Estudo Exemplo", subtitle: "Subtítulo",
                content: "<p>Conteúdo de exemplo</p>", estimatedReadingTime: 10,
                tags: ["exemplo"], author: "Autor", date: "2024-01-01",
                isCompleted: false, isFavorite: false,
                categoryData: estudosState.categories[0], readingTime: 10
            }
        ];
        estudosState.filteredStudies = [...estudosState.allStudies];
    }
    function calculateReadingTime(content) {
        if (!content) return 5;
        const wordCount = content.split(/\s+/).length;
        return Math.max(5, Math.ceil(wordCount / 200));
    }
    function setupEventListeners() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            addTrackedListener(btn, 'click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                estudosState.currentFilter = this.dataset.filter;
                applyFilters();
            });
        });
        if (searchInput) {
            let timeout;
            addTrackedListener(searchInput, 'input', function(e) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    estudosState.searchTerm = e.target.value.toLowerCase().trim();
                    applyFilters();
                }, 300);
            });
        }
        if (btnVoltar) {
            addTrackedListener(btnVoltar, 'click', closeStudyView);
        }
        if (navPrev) {
            addTrackedListener(navPrev, 'click', navigateToPrevious);
        }
        if (navNext) {
            addTrackedListener(navNext, 'click', navigateToNext);
        }
        addTrackedListener(document, 'keydown', function(e) {
            if (e.key === 'Escape') {
                if (estudoVisualizacao.classList.contains('fullscreen')) {
                    exitFullScreen();
                } else if (!estudoVisualizacao.classList.contains('hidden')) {
                    closeStudyView();
                }
            }
            if (e.key === 'ArrowLeft' && estudosState.currentStudyId && !estudoVisualizacao.classList.contains('hidden')) {
                navigateToPrevious();
            }
            if (e.key === 'ArrowRight' && estudosState.currentStudyId && !estudoVisualizacao.classList.contains('hidden')) {
                navigateToNext();
            }
        });
    }
    function applyFilters() {
        const filtered = estudosState.allStudies.filter(study => {
            if (estudosState.currentFilter === 'favorites' && !study.isFavorite) return false;
            if (estudosState.currentFilter === 'completed' && !study.isCompleted) return false;
            if (estudosState.currentFilter === 'unread' && study.isCompleted) return false;
            if (estudosState.searchTerm) {
                const term = estudosState.searchTerm;
                return study.title.toLowerCase().includes(term) ||
                       study.subtitle?.toLowerCase().includes(term) ||
                       study.tags?.some(t => t.toLowerCase().includes(term)) ||
                       study.author?.toLowerCase().includes(term);
            }
            return true;
        });
        estudosState.filteredStudies = filtered;
        renderCategoriasGrid();
        updateGlobalProgress();
    }
    function setCategoryHeight(categoryElement, expand) {
        const cardsDiv = categoryElement.querySelector('.categoria-cards');
        if (!cardsDiv) return;
        if (expand) {
            cardsDiv.style.padding = '1rem 1.25rem';
            const height = cardsDiv.scrollHeight;
            cardsDiv.style.maxHeight = height + 'px';
        } else {
            cardsDiv.style.padding = '0rem 1.25rem';
            cardsDiv.style.maxHeight = '0';
        }
    }
    function renderCategoriasGrid() {
        categoriasGrid.innerHTML = '';
        const categoriesWithStudies = estudosState.categories
            .map(cat => ({
                ...cat,
                studies: estudosState.filteredStudies.filter(s => s.category === cat.id)
            }))
            .filter(cat => cat.studies.length > 0);
        if (categoriesWithStudies.length === 0) {
            categoriasGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum estudo encontrado</h3>
                    <p>Tente ajustar os filtros ou a busca.</p>
                </div>
            `;
            return;
        }
        categoriesWithStudies.forEach(category => {
            const isExpanded = estudosState.expandedCategories[category.id] !== false;
            const categoryElement = document.createElement('div');
            categoryElement.className = 'categoria-card';
            if (!isExpanded) {
                categoryElement.classList.add('minimized');
            }
            categoryElement.dataset.category = category.id;
            categoryElement.innerHTML = `
                <div class="categoria-header" style="background: ${category.color}10; border-bottom-color: ${category.color}">
                    <div class="categoria-titulo">
                        <i class="${category.icon}" style="background: ${category.color}20; color: ${category.color}"></i>
                        <h2>${category.name}</h2>
                        <span class="categoria-count">${category.studies.length}</span>
                    </div>
                    <button class="categoria-toggle" data-category="${category.id}">
                        <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
                    </button>
                </div>
                <div class="categoria-cards ${isExpanded ? 'expanded' : ''}" id="cards-${category.id}">
                    ${category.studies.map(study => renderStudyCard(study)).join('')}
                </div>
            `;
            const toggleBtn = categoryElement.querySelector('.categoria-toggle');
            const header = categoryElement.querySelector('.categoria-header');
            function toggleCategory() {
                const catId = category.id;
                const cardsDiv = document.getElementById(`cards-${catId}`);
                const isNowExpanded = cardsDiv.classList.contains('expanded');
                if (isNowExpanded) {
                    cardsDiv.classList.remove('expanded');
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
                    estudosState.expandedCategories[catId] = false;
                    categoryElement.classList.add('minimized');
                    setCategoryHeight(categoryElement, false);
                } else {
                    cardsDiv.classList.add('expanded');
                    toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                    estudosState.expandedCategories[catId] = true;
                    categoryElement.classList.remove('minimized');
                    setCategoryHeight(categoryElement, true);
                }
                localStorage.setItem('expanded_categories', JSON.stringify(estudosState.expandedCategories));
            }
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCategory();
            });
            header.addEventListener('click', (e) => {
                if (e.target.closest('.categoria-toggle')) return;
                toggleCategory();
            });
            categoriasGrid.appendChild(categoryElement);
        });
        document.querySelectorAll('.categoria-card').forEach(card => {
            const isExpanded = card.querySelector('.categoria-cards').classList.contains('expanded');
            if (isExpanded) {
                setCategoryHeight(card, true);
            } else {
                setCategoryHeight(card, false);
            }
        });
        document.querySelectorAll('.estudo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-favorite')) {
                    const studyId = card.dataset.studyId;
                    loadStudy(studyId);
                }
            });
        });
        document.querySelectorAll('.card-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const studyId = btn.dataset.studyId;
                toggleFavorite(studyId);
            });
        });
    }
    function renderStudyCard(study) {
        const categoryColor = study.categoryData.color;
        return `
            <div class="estudo-card" data-study-id="${study.id}" style="border-left-color: ${categoryColor}">
                <div class="card-header">
                    <h3 class="card-titulo" title="${study.title}">${study.title}</h3>
                    <button class="card-favorite ${study.isFavorite ? 'active' : ''}" data-study-id="${study.id}" title="${study.isFavorite ? 'Remover favorito' : 'Adicionar favorito'}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="card-meta">
                    <span class="card-tempo">
                        <i class="far fa-clock"></i> ${study.readingTime} min
                    </span>
                    ${study.isCompleted ? '<span class="card-concluido"><i class="fas fa-check-circle"></i> Lido</span>' : ''}
                </div>
            </div>
        `;
    }
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            estudoVisualizacao.requestFullscreen().catch(err => {
                console.error('Erro ao ativar tela cheia:', err);
            });
            estudoVisualizacao.classList.add('fullscreen');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            estudoVisualizacao.classList.remove('fullscreen');
        }
    }
    function exitFullScreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        estudoVisualizacao.classList.remove('fullscreen');
    }
    function loadStudy(studyId) {
        const study = estudosState.allStudies.find(s => s.id === studyId);
        if (!study) return;
        estudosState.currentStudyId = studyId;
        if (estudosState.currentStudyCSS) {
            estudosState.currentStudyCSS.remove();
            estudosState.currentStudyCSS = null;
        }
        if (study.css && study.css.trim()) {
            estudosState.currentStudyCSS = document.createElement('style');
            estudosState.currentStudyCSS.textContent = study.css;
            estudosState.currentStudyCSS.id = 'current-study-css';
            document.head.appendChild(estudosState.currentStudyCSS);
        }
        estudoWrapper.innerHTML = `
            <div class="estudo-conteudo">
                <div class="estudo-cabecalho">
                    <div class="estudo-titulo-area">
                        <h2>${study.title}</h2>
                        <div class="estudo-acoes">
                            <button class="estudo-btn" id="estudoBtnFullscreen" title="Tela cheia">
                                <i class="fas fa-expand"></i>
                            </button>
                            <button class="estudo-btn ${study.isCompleted ? 'completed' : ''}" id="estudoBtnConcluir" title="${study.isCompleted ? 'Marcar não lido' : 'Marcar lido'}">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="estudo-btn favorite ${study.isFavorite ? 'active' : ''}" id="estudoBtnFavorito" title="${study.isFavorite ? 'Remover favorito' : 'Adicionar favorito'}">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                    <div class="estudo-meta">
                        <span class="estudo-categoria-badge" style="background: ${study.categoryData.color}20; color: ${study.categoryData.color}">
                            <i class="${study.categoryData.icon}"></i> ${study.categoryData.name}
                        </span>
                        <span class="estudo-tempo"><i class="far fa-clock"></i> ${study.readingTime} min</span>
                        <span class="estudo-autor"><i class="far fa-user"></i> ${study.author || 'Bibliotheca'}</span>
                        <span class="estudo-data"><i class="far fa-calendar"></i> ${formatDate(study.date)}</span>
                    </div>
                    <div class="estudo-tags">
                        ${study.tags.map(tag => `<span class="estudo-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="estudo-corpo">${study.content}</div>
            </div>
        `;
        const btnFullscreen = document.getElementById('estudoBtnFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', toggleFullScreen);
        }
        const btnConcluir = document.getElementById('estudoBtnConcluir');
        if (btnConcluir) {
            btnConcluir.addEventListener('click', () => toggleReadStatus(studyId));
        }
        const btnFavorito = document.getElementById('estudoBtnFavorito');
        if (btnFavorito) {
            btnFavorito.addEventListener('click', () => toggleFavorite(studyId));
        }
        updateNavigationIndicators();
        categoriasGrid.classList.add('hidden');
        estudoVisualizacao.classList.remove('hidden');
        addToHistory(studyId);
    }
    function closeStudyView() {
        categoriasGrid.classList.remove('hidden');
        estudoVisualizacao.classList.add('hidden');
        exitFullScreen();
        if (estudosState.currentStudyCSS) {
            estudosState.currentStudyCSS.remove();
            estudosState.currentStudyCSS = null;
        }
        estudosState.currentStudyId = null;
    }
    function navigateToPrevious() {
        const currentIndex = estudosState.filteredStudies.findIndex(s => s.id === estudosState.currentStudyId);
        if (currentIndex > 0) {
            loadStudy(estudosState.filteredStudies[currentIndex - 1].id);
        }
    }
    function navigateToNext() {
        const currentIndex = estudosState.filteredStudies.findIndex(s => s.id === estudosState.currentStudyId);
        if (currentIndex < estudosState.filteredStudies.length - 1) {
            loadStudy(estudosState.filteredStudies[currentIndex + 1].id);
        }
    }
    function updateNavigationIndicators() {
        const currentIndex = estudosState.filteredStudies.findIndex(s => s.id === estudosState.currentStudyId);
        if (navPrev) navPrev.disabled = currentIndex <= 0;
        if (navNext) navNext.disabled = currentIndex >= estudosState.filteredStudies.length - 1;
        if (navIndicator) {
            navIndicator.textContent = `${currentIndex + 1} de ${estudosState.filteredStudies.length}`;
        }
    }
    function toggleReadStatus(studyId) {
        const study = estudosState.allStudies.find(s => s.id === studyId);
        if (!study) return;
        if (estudosState.studyProgress[studyId]) {
            delete estudosState.studyProgress[studyId];
            study.isCompleted = false;
            showNotification('Estudo marcado como não lido', 'check');
        } else {
            estudosState.studyProgress[studyId] = {
                date: new Date().toISOString(),
                completed: true,
                percent: 100
            };
            study.isCompleted = true;
            showNotification('Estudo concluído!', 'check');
        }
        localStorage.setItem('tarot_studies_progress', JSON.stringify(estudosState.studyProgress));
        updateGlobalProgress();
        renderCategoriasGrid();
        const btn = document.getElementById('estudoBtnConcluir');
        if (btn) {
            btn.classList.toggle('completed', study.isCompleted);
            btn.title = study.isCompleted ? 'Marcar não lido' : 'Marcar lido';
        }
    }
    function toggleFavorite(studyId) {
        const study = estudosState.allStudies.find(s => s.id === studyId);
        if (!study) return;
        const index = estudosState.favoriteStudies.indexOf(studyId);
        if (index === -1) {
            estudosState.favoriteStudies.push(studyId);
            study.isFavorite = true;
            showNotification('Adicionado aos favoritos', 'star');
        } else {
            estudosState.favoriteStudies.splice(index, 1);
            study.isFavorite = false;
            showNotification('Removido dos favoritos', 'star');
        }
        localStorage.setItem('tarot_studies_favorites', JSON.stringify(estudosState.favoriteStudies));
        renderCategoriasGrid();
        const btn = document.getElementById('estudoBtnFavorito');
        if (btn) {
            btn.classList.toggle('active', study.isFavorite);
            btn.title = study.isFavorite ? 'Remover favorito' : 'Adicionar favorito';
        }
        if (estudosState.currentFilter === 'favorites') {
            applyFilters();
        }
    }
    function addToHistory(studyId) {
        estudosState.studyHistory.unshift({ studyId, timestamp: new Date().toISOString() });
        if (estudosState.studyHistory.length > 50) estudosState.studyHistory.pop();
        localStorage.setItem('tarot_studies_history', JSON.stringify(estudosState.studyHistory));
    }
    function updateGlobalProgress() {
        const total = estudosState.allStudies.length;
        const completed = Object.keys(estudosState.studyProgress).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        if (globalProgressFill) globalProgressFill.style.width = `${percent}%`;
        if (globalProgressText) globalProgressText.textContent = `${percent}%`;
    }
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return dateString;
        }
    }
    function showNotification(message, type = 'check') {
        const existing = document.querySelector('.biblioteca-notification');
        if (existing) existing.remove();
        const icon = type === 'star' ? 'fa-star' : 'fa-check-circle';
        const color = type === 'star' ? '#ffd700' : '#4caf50';
        const notification = document.createElement('div');
        notification.className = 'biblioteca-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}" style="color: ${color}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 50);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
    function showError(message, error) {
        categoriasGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <p>${error.message || 'Erro desconhecido'}</p>
                <button class="btn-tentar" onclick="reiniciarEstudos()">Tentar novamente</button>
            </div>
        `;
    }
    function cleanupEventListeners() {
        estudosState.eventListeners.forEach(({ element, event, handler }) => {
            if (element) element.removeEventListener(event, handler);
        });
        estudosState.eventListeners = [];
        if (estudosState.currentStudyCSS) {
            estudosState.currentStudyCSS.remove();
            estudosState.currentStudyCSS = null;
        }
        const globalStyles = document.getElementById('biblioteca-global-styles');
        if (globalStyles) globalStyles.remove();
    }
    window.estudosCleanup = function() {
        cleanupEventListeners();
        window.estudosInitialized = false;
        delete window.estudosState;
    };
    window.reiniciarEstudos = function() {
        if (window.estudosCleanup) window.estudosCleanup();
        window.estudosInitialized = false;
        iniciarSistemaEstudos();
    };
    init();
}
(function() {
    let initTimeout;
    function delayedInit() {
        clearTimeout(initTimeout);
        initTimeout = setTimeout(() => {
            if (!window.estudosInitialized) iniciarSistemaEstudos();
        }, 100);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', delayedInit);
    } else {
        delayedInit();
    }
})();
window.iniciarSistemaEstudos = iniciarSistemaEstudos;