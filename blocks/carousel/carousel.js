import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createSliderControls } from '../../scripts/slider.js';

const AUTO_ADVANCE_MS = 6000;

/**
 * Fade-aware showSlide: toggles aria-hidden/opacity instead of scrolling.
 */
function showSlide(block, slideIndex) {
  const slides = block.querySelectorAll('.carousel-slide');
  if (!slides.length) return;

  let idx = slideIndex % slides.length;
  if (idx < 0) idx += slides.length;

  block.dataset.activeSlide = String(idx);

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', String(i !== idx));
    slide.querySelectorAll('a').forEach((link) => {
      if (i !== idx) link.setAttribute('tabindex', '-1');
      else link.removeAttribute('tabindex');
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, i) => {
    const btn = indicator.querySelector('button');
    if (!btn) return;
    if (i === idx) btn.setAttribute('disabled', 'true');
    else btn.removeAttribute('disabled');
  });
}

export { showSlide };

function stopAutoAdvance(block) {
  if (block.autoAdvanceTimer) {
    clearInterval(block.autoAdvanceTimer);
    block.autoAdvanceTimer = null;
  }
}

function startAutoAdvance(block) {
  stopAutoAdvance(block);
  block.autoAdvanceTimer = setInterval(() => {
    const current = parseInt(block.dataset.activeSlide, 10) || 0;
    showSlide(block, current + 1);
  }, AUTO_ADVANCE_MS);
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');
  slide.setAttribute('aria-hidden', slideIndex === 0 ? 'false' : 'true');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

function showFacesSlide(block, index) {
  const contentEls = block.facesContentEls;
  if (!contentEls || !contentEls.length) return;

  const idx = ((index % contentEls.length) + contentEls.length) % contentEls.length;
  block.dataset.activeSlide = String(idx);
  block.dataset.facesTheme = String((idx % 4) + 1);

  const imageCol = block.querySelector('.carousel-faces-image');
  const textArea = block.querySelector('.carousel-faces-text');

  if (imageCol) {
    let img = imageCol.querySelector(':scope > img');
    if (!img) {
      img = document.createElement('img');
      imageCol.prepend(img);
    }
    img.src = block.facesImages[idx].src;
    img.alt = block.facesImages[idx].alt;
  }

  if (textArea) {
    textArea.textContent = '';
    const clone = contentEls[idx].cloneNode(true);
    while (clone.firstChild) textArea.append(clone.firstChild);
  }

  const thumbs = block.querySelectorAll('.carousel-faces-thumb');
  thumbs.forEach((thumb, i) => {
    thumb.classList.toggle('active', i === idx);
    if (i === idx) {
      thumb.setAttribute('aria-current', 'true');
    } else {
      thumb.removeAttribute('aria-current');
    }
  });
}

function decorateFaces(block, blockId, rows) {
  block.classList.add('carousel-faces');

  const layout = document.createElement('div');
  layout.className = 'carousel-faces-layout';

  const imageCol = document.createElement('div');
  imageCol.className = 'carousel-faces-image';

  const contentCol = document.createElement('div');
  contentCol.className = 'carousel-faces-content';

  const textArea = document.createElement('div');
  textArea.className = 'carousel-faces-text';

  const thumbRow = document.createElement('div');
  thumbRow.className = 'carousel-faces-thumbs';

  block.facesImages = [];
  block.facesContentEls = [];

  rows.forEach((row, idx) => {
    const cols = row.querySelectorAll(':scope > div');
    const imgEl = cols[0]?.querySelector('img');
    const contentEl = cols[1];

    block.facesImages.push({
      src: imgEl?.src || '',
      alt: imgEl?.alt || '',
    });
    block.facesContentEls.push(contentEl ? contentEl.cloneNode(true) : document.createElement('div'));

    const thumb = document.createElement('button');
    thumb.className = 'carousel-faces-thumb';
    thumb.type = 'button';
    thumb.setAttribute('aria-label', imgEl?.alt || `Show slide ${idx + 1}`);
    const thumbImg = document.createElement('img');
    thumbImg.src = imgEl?.src || '';
    thumbImg.alt = imgEl?.alt || '';
    thumbImg.loading = 'lazy';
    thumb.append(thumbImg);
    thumb.addEventListener('click', () => showFacesSlide(block, idx));
    thumbRow.append(thumb);

    row.remove();
  });

  block.dataset.activeSlide = '0';
  block.dataset.facesTheme = '1';

  const heading = document.createElement('h2');
  heading.className = 'carousel-faces-heading';
  heading.textContent = 'Faces & Voices';

  // Decorative disks behind portrait
  const diskContainer = document.createElement('div');
  diskContainer.className = 'carousel-faces-disks';
  for (let i = 1; i <= 2; i += 1) {
    const disk = document.createElement('div');
    disk.className = `carousel-faces-disk carousel-faces-disk-${i}`;
    diskContainer.append(disk);
  }
  imageCol.append(diskContainer);

  contentCol.append(heading, textArea, thumbRow);
  layout.append(imageCol, contentCol);
  block.textContent = '';
  block.append(layout);

  showFacesSlide(block, 0);
}

export default async function decorate(block) {
  const blockId = getBlockId('carousel');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `carousel-${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  if (block.classList.contains('faces')) {
    decorateFaces(block, blockId, rows);
    return;
  }

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  slidesWrapper.setAttribute('aria-label', 'Carousel slides');

  if (!isSingleSlide) {
    const { indicatorsNav, buttonsContainer } = createSliderControls(rows.length);

    // Add pause/play button between prev and next
    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.classList.add('slide-toggle-play');
    pauseBtn.setAttribute('aria-label', 'Pause auto-advance');
    const nextBtn = buttonsContainer.querySelector('.slide-next');
    buttonsContainer.insertBefore(pauseBtn, nextBtn);

    pauseBtn.addEventListener('click', () => {
      const isPaused = pauseBtn.classList.toggle('paused');
      if (isPaused) {
        stopAutoAdvance(block);
        pauseBtn.setAttribute('aria-label', 'Resume auto-advance');
      } else {
        startAutoAdvance(block);
        pauseBtn.setAttribute('aria-label', 'Pause auto-advance');
      }
    });

    // Indicators go inside the slides container (overlaid on image)
    container.append(indicatorsNav);
    // Nav buttons go after the container (below the image)
    block.navButtonsContainer = buttonsContainer;
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, blockId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (block.navButtonsContainer) {
    block.append(block.navButtonsContainer);
    delete block.navButtonsContainer;
  }

  block.dataset.activeSlide = '0';

  if (!isSingleSlide) {
    // Bind indicator and prev/next clicks (fade-aware)
    const indicatorBtns = block.querySelectorAll('.carousel-slide-indicator button');
    indicatorBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const indicator = e.currentTarget.closest('.carousel-slide-indicator');
        if (indicator) {
          const target = parseInt(indicator.dataset.targetSlide, 10);
          if (!Number.isNaN(target)) showSlide(block, target);
        }
      });
    });

    const prevBtn = block.querySelector('.slide-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const current = parseInt(block.dataset.activeSlide, 10) || 0;
        showSlide(block, current - 1);
      });
    }

    const nextBtn = block.querySelector('.slide-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const current = parseInt(block.dataset.activeSlide, 10) || 0;
        showSlide(block, current + 1);
      });
    }

    // Keyboard nav
    block.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      const next = e.key === 'ArrowLeft' ? current - 1 : current + 1;
      e.preventDefault();
      showSlide(block, next);
    });

    // Start auto-advance
    startAutoAdvance(block);
  }
}
