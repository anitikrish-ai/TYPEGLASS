/**
 * LiquidType Navigation & Page View Controller
 */

export class NavigationManager {
  constructor(options = {}) {
    this.currentPage = 'home';
    this.onPageChange = options.onPageChange || (() => {});
    this.navButtons = document.querySelectorAll('[data-nav-target]');
    this.pageSections = document.querySelectorAll('.page-view');

    this.init();
  }

  init() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.dataset.navTarget;
        if (target) {
          this.navigateTo(target);
        }
      });
    });
  }

  navigateTo(pageId, pageArgs = null) {
    if (!pageId) return;

    this.currentPage = pageId;

    // Update active nav button styling
    this.navButtons.forEach(btn => {
      if (btn.dataset.navTarget === pageId) {
        btn.classList.add('nav-item-active');
      } else {
        btn.classList.remove('nav-item-active');
      }
    });

    // Update page section visibility with fluid glass transitions
    this.pageSections.forEach(section => {
      if (section.id === `page-${pageId}`) {
        section.classList.remove('hidden');
        section.classList.add('page-active-enter');
        setTimeout(() => section.classList.remove('page-active-enter'), 300);
      } else {
        section.classList.add('hidden');
      }
    });

    this.onPageChange(pageId, pageArgs);
  }

  getCurrentPage() {
    return this.currentPage;
  }
}
