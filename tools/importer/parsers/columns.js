/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns
 * Source: https://www.buffalo.edu/
 * Base block: columns
 * Selector: #stats-table
 * Note: Columns block does NOT require field hint comments (per hinting.md exception)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all stat containers within #stats-table
  const statContainers = element.querySelectorAll('.container > .core-text, .container > .text');
  const row = [];

  statContainers.forEach((stat) => {
    const frag = document.createDocumentFragment();

    // Extract the stat number (bold/strong text)
    const boldEl = stat.querySelector('b, strong');
    if (boldEl) {
      const pNum = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = boldEl.textContent.trim();
      pNum.appendChild(strong);
      frag.appendChild(pNum);
    }

    // Extract the description text (remaining text after the bold number)
    const fullText = stat.textContent.trim();
    const boldText = boldEl ? boldEl.textContent.trim() : '';
    const descText = fullText.replace(boldText, '').trim();
    if (descText) {
      const pDesc = document.createElement('p');
      pDesc.textContent = descText;
      frag.appendChild(pDesc);
    }

    row.push(frag);
  });

  // If no stat containers found, try extracting paragraphs directly
  if (row.length === 0) {
    const paragraphs = element.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(p.cloneNode(true));
      row.push(frag);
    });
  }

  if (row.length > 0) {
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns',
    cells,
  });

  element.replaceWith(block);
}
