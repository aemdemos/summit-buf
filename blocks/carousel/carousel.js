import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createSliderControls, initSlider, showSlide } from '../../scripts/slider.js';

export { showSlide };

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

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

  const imageCol = block.querySelector('.carousel-faces-image');
  const textArea = block.querySelector('.carousel-faces-text');

  if (imageCol) {
    imageCol.textContent = '';
    const img = document.createElement('img');
    img.src = block.facesImages[idx].src;
    img.alt = block.facesImages[idx].alt;
    imageCol.append(img);
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

  // Store content as DOM nodes to avoid innerHTML/XSS
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

  contentCol.append(textArea, thumbRow);
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
  slidesWrapper.setAttribute('tabindex', '0');
  slidesWrapper.setAttribute('aria-label', 'Carousel slides');
  block.prepend(slidesWrapper);

  if (!isSingleSlide) {
    const { indicatorsNav, buttonsContainer } = createSliderControls(rows.length);
    block.append(indicatorsNav);
    container.append(buttonsContainer);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, blockId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    initSlider(block);
    slidesWrapper.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const current = parseInt(block.dataset.activeSlide, 10) || 0;
      const next = e.key === 'ArrowLeft' ? current - 1 : current + 1;
      e.preventDefault();
      showSlide(block, next, 'smooth');
    });
  }
}
