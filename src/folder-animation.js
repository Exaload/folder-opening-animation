// folder animation controller
(function() {
    const CONFIG = {
        openDuration: 350,
        closeDuration: 280,
        fullscreenMargin: 20,
        smallModalWidth: 280,
        smallModalItemHeight: 50,
        smallModalMaxItems: 8,
        overlayBlur: 8,
        enableOverlayClose: true,
        enableEscapeClose: true
    };

    const overlay = document.querySelector('.folder-overlay');
    let currentModal = null;
    let isAnimating = false;

    function init() {
        const fullBtns = document.querySelectorAll('[folder-full]');
        const smallBtns = document.querySelectorAll('[folder-small-modal]');

        fullBtns.forEach(btn => {
            btn.addEventListener('click', () => openFolder(btn, 'full'));
        });

        smallBtns.forEach(btn => {
            btn.addEventListener('click', () => openFolder(btn, 'small'));
        });

        if (CONFIG.enableOverlayClose) {
            overlay.addEventListener('click', closeCurrentModal);
        }
        if (CONFIG.enableEscapeClose) {
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') closeCurrentModal();
            });
        }
    }

    function getContent(btnId) {
        return document.querySelector(`[folder-content-for="${btnId}"]`);
    }

    function getParentZone(btnId) {
        return document.querySelector(`[folder-parent-for="${btnId}"]`);
    }

    function openFolder(btn, type) {
        if (isAnimating || currentModal) return;
        isAnimating = true;

        const content = getContent(btn.id);
        if (!content) {
            isAnimating = false;
            return;
        }

        btn.classList.add('opening');
        setTimeout(() => btn.classList.remove('opening'), 300);

        const modal = document.createElement('div');
        modal.className = 'folder-modal opening';
        if (type === 'small') modal.classList.add('small-modal');

        const hideHeader = content.hasAttribute('folder-hide-header');
        const customTitle = content.getAttribute('folder-title');
        const customIcon = content.getAttribute('folder-icon');
        const hideClose = content.hasAttribute('folder-hide-close');
        const headerBg = content.getAttribute('folder-header-bg');

        let header = null;
        if (!hideHeader) {
            header = document.createElement('div');
            header.className = 'folder-modal-header';
            if (headerBg) header.style.background = headerBg;

            const title = document.createElement('div');
            title.className = 'folder-modal-title';
            const iconText = customIcon || btn.querySelector('.folder-icon')?.textContent || '📁';
            const titleText = customTitle || btn.querySelector('span')?.textContent || 'Folder';
            title.innerHTML = `<span class="icon">${iconText}</span><span>${titleText}</span>`;

            header.appendChild(title);

            if (!hideClose) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'folder-modal-close';
                closeBtn.innerHTML = '✕';
                closeBtn.addEventListener('click', closeCurrentModal);
                header.appendChild(closeBtn);
            }
        }

        const body = document.createElement('div');
        body.className = 'folder-modal-body';

        applyLayout(body, content);

        const items = content.querySelectorAll('.folder-item');
        items.forEach(item => {
            const clone = item.cloneNode(true);
            body.appendChild(clone);
        });

        if (header) modal.appendChild(header);
        modal.appendChild(body);
        document.body.appendChild(modal);

        currentModal = modal;
        overlay.classList.add('active');

        const btnRect = btn.getBoundingClientRect();
        const startX = btnRect.left + btnRect.width / 2;
        const startY = btnRect.top + btnRect.height / 2;

        modal.style.transformOrigin = `${startX}px ${startY}px`;

        if (type === 'full') {
            positionFullModal(btn, modal, startX, startY);
        } else {
            positionSmallModal(btn, modal, items.length, startX, startY);
        }

        setTimeout(() => {
            body.querySelectorAll('.folder-item').forEach(item => item.classList.add('animate-in'));
            isAnimating = false;
        }, 100);
    }

    function positionFullModal(btn, modal, startX, startY) {
        const parent = getParentZone(btn.id);

        let targetRect;
        if (parent) {
            targetRect = parent.getBoundingClientRect();
        } else {
            const m = CONFIG.fullscreenMargin;
            targetRect = {
                left: m,
                top: m,
                width: window.innerWidth - m * 2,
                height: window.innerHeight - m * 2
            };
        }

        modal.style.left = `${targetRect.left}px`;
        modal.style.top = `${targetRect.top}px`;
        modal.style.width = `${targetRect.width}px`;
        modal.style.height = `${targetRect.height}px`;

        const originX = ((startX - targetRect.left) / targetRect.width) * 100;
        const originY = ((startY - targetRect.top) / targetRect.height) * 100;
        modal.style.transformOrigin = `${originX}% ${originY}%`;
    }

    function positionSmallModal(btn, modal, itemCount, startX, startY) {
        const btnRect = btn.getBoundingClientRect();

        const baseHeight = 60;
        const width = Math.min(CONFIG.smallModalWidth, window.innerWidth - 40);
        const height = baseHeight + Math.min(itemCount, CONFIG.smallModalMaxItems) * CONFIG.smallModalItemHeight;

        let left = btnRect.left + btnRect.width / 2 - width / 2;
        let top = btnRect.bottom + 10;

        if (left < 10) left = 10;
        if (left + width > window.innerWidth - 10) left = window.innerWidth - width - 10;
        if (top + height > window.innerHeight - 10) {
            top = btnRect.top - height - 10;
        }

        modal.style.left = `${left}px`;
        modal.style.top = `${top}px`;
        modal.style.width = `${width}px`;
        modal.style.height = `${height}px`;

        const originX = ((startX - left) / width) * 100;
        const originY = ((startY - top) / height) * 100;
        modal.style.transformOrigin = `${originX}% ${originY}%`;
    }

    function applyLayout(body, content) {
        const direction = content.getAttribute('folder-direction') || 'column';
        const justify = content.getAttribute('folder-justify');
        const align = content.getAttribute('folder-align');
        const gap = content.getAttribute('folder-gap');
        const padding = content.getAttribute('folder-padding');
        const cols = content.getAttribute('folder-cols');

        switch (direction) {
            case 'row':       body.classList.add('layout-row'); break;
            case 'row-wrap':  body.classList.add('layout-row-wrap'); break;
            case 'grid':      body.classList.add('layout-grid'); break;
            default:          body.classList.add('layout-column');
        }

        if (justify) body.classList.add(`justify-${justify}`);
        if (align)   body.classList.add(`align-${align}`);
        if (gap)     body.style.gap = `${gap}px`;
        if (padding) body.style.padding = `${padding}px`;
        if (cols && direction === 'grid') {
            body.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        }
    }

    function closeCurrentModal() {
        if (!currentModal || isAnimating) return;
        isAnimating = true;

        currentModal.classList.remove('opening');
        currentModal.classList.add('closing');
        overlay.classList.remove('active');

        const modal = currentModal;
        setTimeout(() => {
            modal.remove();
            currentModal = null;
            isAnimating = false;
        }, CONFIG.closeDuration);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
