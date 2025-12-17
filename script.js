// folder animation controller
(function() {
    // config options
    const CONFIG = {
        openDuration: 350,        // modal open anim duration (ms)
        closeDuration: 280,       // modal close anim duration (ms)
        fullscreenMargin: 20,     // margin for fullscreen mode (px)
        smallModalWidth: 280,     // base width for small modal (px)
        smallModalItemHeight: 50, // height per item in small modal (px)
        smallModalMaxItems: 8,    // max visible items before scroll
        overlayBlur: 8,           // blur amount for overlay (px)
        enableOverlayClose: true, // click overlay to close
        enableEscapeClose: true   // press escape to close
    };

    const overlay = document.querySelector('.folder-overlay');
    let currentModal = null;
    let isAnimating = false;

    // init all folder btns
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

    // get folder content by btn id
    function getContent(btnId) {
        return document.querySelector(`[folder-content-for="${btnId}"]`);
    }

    // get parent zone if exists
    function getParentZone(btnId) {
        return document.querySelector(`[folder-parent-for="${btnId}"]`);
    }

    // open folder modal
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

        // create modal
        const modal = document.createElement('div');
        modal.className = 'folder-modal opening';
        if (type === 'small') modal.classList.add('small-modal');

        // header
        const header = document.createElement('div');
        header.className = 'folder-modal-header';

        const title = document.createElement('div');
        title.className = 'folder-modal-title';
        title.innerHTML = `<span class="icon">${btn.querySelector('.folder-icon')?.textContent || '📁'}</span>
                          <span>${btn.querySelector('span')?.textContent || 'Folder'}</span>`;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'folder-modal-close';
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', closeCurrentModal);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // body
        const body = document.createElement('div');
        body.className = 'folder-modal-body';

        // apply layout from attrs
        applyLayout(body, content);

        // clone content items
        const items = content.querySelectorAll('.folder-item');
        items.forEach(item => {
            const clone = item.cloneNode(true);
            body.appendChild(clone);
        });

        modal.appendChild(header);
        modal.appendChild(body);
        document.body.appendChild(modal);

        currentModal = modal;
        overlay.classList.add('active');

        // calc position and size
        const btnRect = btn.getBoundingClientRect();
        const startX = btnRect.left + btnRect.width / 2;
        const startY = btnRect.top + btnRect.height / 2;

        // set transform origin from btn pos
        modal.style.transformOrigin = `${startX}px ${startY}px`;

        if (type === 'full') {
            positionFullModal(btn, modal, startX, startY);
        } else {
            positionSmallModal(btn, modal, items.length, startX, startY);
        }

        // animate items in
        setTimeout(() => {
            body.querySelectorAll('.folder-item').forEach(item => item.classList.add('animate-in'));
            isAnimating = false;
        }, 100);
    }

    // position full screen or parent zone modal
    function positionFullModal(btn, modal, startX, startY) {
        const parent = getParentZone(btn.id);
        
        let targetRect;
        if (parent) {
            targetRect = parent.getBoundingClientRect();
        } else {
            // full screen with margin
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

        // recalc origin for smooth anim
        const modalCenterX = targetRect.left + targetRect.width / 2;
        const modalCenterY = targetRect.top + targetRect.height / 2;
        const originX = ((startX - targetRect.left) / targetRect.width) * 100;
        const originY = ((startY - targetRect.top) / targetRect.height) * 100;
        modal.style.transformOrigin = `${originX}% ${originY}%`;
    }

    // position small adaptive modal
    function positionSmallModal(btn, modal, itemCount, startX, startY) {
        const btnRect = btn.getBoundingClientRect();
        
        // calc size based on content
        const baseHeight = 60;
        const width = Math.min(CONFIG.smallModalWidth, window.innerWidth - 40);
        const height = baseHeight + Math.min(itemCount, CONFIG.smallModalMaxItems) * CONFIG.smallModalItemHeight;
        
        // position near btn
        let left = btnRect.left + btnRect.width / 2 - width / 2;
        let top = btnRect.bottom + 10;

        // keep in viewport
        if (left < 10) left = 10;
        if (left + width > window.innerWidth - 10) left = window.innerWidth - width - 10;
        if (top + height > window.innerHeight - 10) {
            top = btnRect.top - height - 10;
        }

        modal.style.left = `${left}px`;
        modal.style.top = `${top}px`;
        modal.style.width = `${width}px`;
        modal.style.height = `${height}px`;

        // origin from btn
        const originX = ((startX - left) / width) * 100;
        const originY = ((startY - top) / height) * 100;
        modal.style.transformOrigin = `${originX}% ${originY}%`;
    }

    // apply layout attrs to body
    function applyLayout(body, content) {
        const direction = content.getAttribute('folder-direction') || 'column';
        const justify = content.getAttribute('folder-justify');
        const align = content.getAttribute('folder-align');
        const gap = content.getAttribute('folder-gap');
        const padding = content.getAttribute('folder-padding');
        const cols = content.getAttribute('folder-cols');

        // direction class
        switch (direction) {
            case 'row':
                body.classList.add('layout-row');
                break;
            case 'row-wrap':
                body.classList.add('layout-row-wrap');
                break;
            case 'grid':
                body.classList.add('layout-grid');
                break;
            default:
                body.classList.add('layout-column');
        }

        // justify
        if (justify) body.classList.add(`justify-${justify}`);

        // align
        if (align) body.classList.add(`align-${align}`);

        // custom gap
        if (gap) body.style.gap = `${gap}px`;

        // custom padding
        if (padding) body.style.padding = `${padding}px`;

        // grid cols
        if (cols && direction === 'grid') {
            body.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        }
    }

    // close current modal
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

    // run on dom ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
