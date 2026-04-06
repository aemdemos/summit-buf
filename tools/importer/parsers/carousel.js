/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel
 * Source: https://www.buffalo.edu/
 * Base block: carousel
 * Selectors: #randomized-slideshow, div.facesvoiceshero.carousel
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all slides - support both hero slideshow and faces/voices carousel
  const slides = element.querySelectorAll('.slide, .faces-voices-slide');

  slides.forEach((slide) => {
    const row = [];

    // Extract image
    const img = slide.querySelector('img');
    if (img) {
      const picture = img.closest('picture') || img;
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:backgroundImage '));
      frag.appendChild(picture.cloneNode(true));
      row.push(frag);
    } else {
      row.push('');
    }

    // Extract text content (caption or quote)
    const titleEl = slide.querySelector('.teaser-title span, .teaser-title, .fv-quote, blockquote');
    const nameEl = slide.querySelector('.fv-name, .fv-attribution, p');
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content '));

    if (titleEl) {
      const p = document.createElement('p');
      p.textContent = titleEl.textContent.trim();
      contentFrag.appendChild(p);
    }
    if (nameEl && nameEl !== titleEl) {
      const pName = document.createElement('p');
      pName.textContent = nameEl.textContent.trim();
      contentFrag.appendChild(pName);
    }

    row.push(contentFrag);
    cells.push(row);
  });

  // If no slides found, try extracting from teaser blocks directly
  if (cells.length === 0) {
    const teasers = element.querySelectorAll('.teaser');
    teasers.forEach((teaser) => {
      const row = [];
      const img = teaser.querySelector('img');
      if (img) {
        const picture = img.closest('picture') || img;
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(' field:backgroundImage '));
        frag.appendChild(picture.cloneNode(true));
        row.push(frag);
      } else {
        row.push('');
      }
      const title = teaser.querySelector('.teaser-title');
      const contentFrag = document.createDocumentFragment();
      contentFrag.appendChild(document.createComment(' field:content '));
      if (title) {
        const p = document.createElement('p');
        p.textContent = title.textContent.trim();
        contentFrag.appendChild(p);
      }
      row.push(contentFrag);
      cells.push(row);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'carousel',
    cells,
  });

  element.replaceWith(block);
}
