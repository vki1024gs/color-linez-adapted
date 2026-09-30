import { menubar, pixelStage } from './elements.js';

// Shared by dialogs and menu input without making dialogs depend on game commands.
function closeMenus() {
  for (const menu of menubar.children) {
    menu.classList.remove('open');
    menu.querySelector('.menu-trigger').setAttribute('aria-expanded', 'false');
  }
}

function fitOpenMenus() {
  const scale = Number(pixelStage.style.getPropertyValue('--ui-scale')) || 1;
  const bottom =
    parseFloat(pixelStage.style.getPropertyValue('--viewport-bottom')) || window.innerHeight;
  for (const menu of menubar.querySelectorAll('.open')) {
    const trigger = menu.querySelector('.menu-trigger').getBoundingClientRect();
    menu
      .querySelector('.dropdown')
      .style.setProperty(
        '--menu-max-height',
        `${Math.max(1, (bottom - (trigger.bottom || 0) - 8) / scale)}px`,
      );
  }
}

export { closeMenus, fitOpenMenus };
