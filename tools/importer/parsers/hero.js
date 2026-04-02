/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero
 * Source: https://www.buffalo.edu/
 * Base block: hero
 * Selector: #tlw-video
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: Background image (video poster/still)
  const img = element.querySelector('.hero-video-wrapper img, .hero-video-wrapper .bg, video');
  const imageFrag = document.createDocumentFragment();
  imageFrag.appendChild(document.createComment(' field:image '));
  if (img && img.tagName === 'IMG') {
    const picture = img.closest('picture') || img;
    imageFrag.appendChild(picture.cloneNode(true));
  } else {
    // Use poster image from video or background
    const videoEl = element.querySelector('video[poster]');
    const bgEl = element.querySelector('.hero-video-wrapper .bg, .hero-video-wrapper');
    if (videoEl && videoEl.poster) {
      const newImg = document.createElement('img');
      newImg.src = videoEl.poster;
      newImg.alt = 'Background video still';
      imageFrag.appendChild(newImg);
    } else if (bgEl) {
      const p = document.createElement('p');
      p.textContent = '(background video)';
      imageFrag.appendChild(p);
    }
  }
  cells.push([imageFrag]);

  // Row 2: Text content - heading + CTA buttons
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));

  // Heading
  const heading = element.querySelector('h3, h2, h1, .title');
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    textFrag.appendChild(h2);
  }

  // CTA buttons
  const buttons = element.querySelectorAll('#tlw-video-cta a, .core-button a, .buttoncomponent a');
  buttons.forEach((btn) => {
    if (btn.href && btn.textContent.trim()) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = btn.href;
      a.textContent = btn.textContent.trim();
      p.appendChild(a);
      textFrag.appendChild(p);
    }
  });

  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero',
    cells,
  });

  element.replaceWith(block);
}
