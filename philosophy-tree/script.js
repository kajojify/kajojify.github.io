const page = document.getElementById('page');
const stage = document.getElementById('treeStage');
const hotspots = [...document.querySelectorAll('.hotspot')];
const panel = document.getElementById('sidePanel');
const cardTitle = document.getElementById('cardTitle');
const cardText = document.getElementById('cardText');
const cardList = document.getElementById('cardList');
const tooltip = document.getElementById('tooltip');
const tipTitle = document.getElementById('tipTitle');
const tipText = document.getElementById('tipText');
const coordDebug = document.getElementById('coordDebug');

const isDebugMode = new URLSearchParams(window.location.search).has('coords');
if (isDebugMode) coordDebug.hidden = false;

let activeHotspot = null;
// Подсказка не показывается на зоне, которую только что кликнули, пока с неё не уведут курсор
let suppressedHotspot = null;

function showTooltip(hotspot, event) {
  tipTitle.textContent = hotspot.dataset.title || '';
  tipText.textContent = hotspot.dataset.description || '';
  tooltip.classList.add('is-visible');
  tooltip.setAttribute('aria-hidden', 'false');
  positionTooltip(event);
}

function hideTooltip() {
  tooltip.classList.remove('is-visible');
  tooltip.setAttribute('aria-hidden', 'true');
}

function positionTooltip(event) {
  if (!event) return;
  const rect = stage.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const offset = 16;

  let x = event.clientX - rect.left + offset;
  let y = event.clientY - rect.top + offset;

  x = Math.min(x, rect.width - tipRect.width - 12);
  y = Math.min(y, rect.height - tipRect.height - 12);
  x = Math.max(12, x);
  y = Math.max(12, y);

  tooltip.style.setProperty('--tip-x', `${x}px`);
  tooltip.style.setProperty('--tip-y', `${y}px`);
}

function openPanel(hotspot) {
  activeHotspot?.classList.remove('is-active');
  activeHotspot = hotspot;

  hotspot.classList.add('is-active');
  cardTitle.textContent = hotspot.dataset.title || '';
  cardText.textContent = hotspot.dataset.description || '';

  cardList.replaceChildren();
  (hotspot.dataset.details || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      cardList.appendChild(li);
    });

  page.classList.add('panel-open');
  panel.setAttribute('aria-hidden', 'false');
}

function closePanel() {
  activeHotspot?.classList.remove('is-active');
  activeHotspot?.blur();
  activeHotspot = null;
  page.classList.remove('panel-open');
  panel.setAttribute('aria-hidden', 'true');
}

hotspots.forEach((hotspot) => {
  hotspot.addEventListener('mouseenter', (event) => {
    if (hotspot !== suppressedHotspot) showTooltip(hotspot, event);
  });

  hotspot.addEventListener('mousemove', (event) => {
    if (hotspot !== suppressedHotspot) positionTooltip(event);
  });

  hotspot.addEventListener('mouseleave', () => {
    if (hotspot === suppressedHotspot) suppressedHotspot = null;
    hideTooltip();
  });

  hotspot.addEventListener('click', (event) => {
    event.stopPropagation();
    hideTooltip();

    // Повторный клик по уже выбранной зоне — выходим из режима панели
    if (hotspot === activeHotspot) {
      closePanel();
      return;
    }

    suppressedHotspot = hotspot;
    openPanel(hotspot);
  });

  hotspot.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPanel(hotspot);
    }
  });
});

document.addEventListener('click', (event) => {
  if (!stage.contains(event.target) && !panel.contains(event.target)) closePanel();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePanel();
});

function updateCoords(event) {
  if (!isDebugMode) return;

  const point = event.touches?.[0] || event;
  const rect = stage.getBoundingClientRect();
  const x = ((point.clientX - rect.left) / rect.width) * 100;
  const y = ((point.clientY - rect.top) / rect.height) * 100;

  coordDebug.textContent = `x: ${x.toFixed(1)}, y: ${y.toFixed(1)}`;
}

stage.addEventListener('mousemove', updateCoords);
stage.addEventListener('touchstart', updateCoords, { passive: true });
stage.addEventListener('touchmove', updateCoords, { passive: true });
