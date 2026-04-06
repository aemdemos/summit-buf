/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards
 * Source: https://www.buffalo.edu/
 * Base block: cards
 * Selectors: ul.list-style-teaser-grid-story, #events-wrapper
 */
export default function parse(element, { document }) {
  const cells = [];

  // Pattern 1: News story grid cards (ul.list-style-teaser-grid-story)
  const storyCards = element.querySelectorAll('li .teaser');
  if (storyCards.length > 0) {
    storyCards.forEach((card) => {
      const row = [];

      // Image
      const img = card.querySelector('img');
      if (img) {
        const picture = img.closest('picture') || img;
        row.push(picture.cloneNode(true));
      } else {
        row.push('');
      }

      // Text content: category + title + link
      const contentFrag = document.createDocumentFragment();
      const category = card.querySelector('.teaser-story-category');
      if (category) {
        const pCat = document.createElement('p');
        pCat.textContent = category.textContent.trim();
        contentFrag.appendChild(pCat);
      }

      const title = card.querySelector('.teaser-title');
      const link = card.querySelector('a.teaser-primary-anchor');
      if (title) {
        const heading = document.createElement('h3');
        if (link && link.href) {
          const a = document.createElement('a');
          a.href = link.href;
          a.textContent = title.textContent.trim();
          heading.appendChild(a);
        } else {
          heading.textContent = title.textContent.trim();
        }
        contentFrag.appendChild(heading);
      }

      row.push(contentFrag);
      cells.push(row);
    });
  }

  // Pattern 2: Events listing (#events-wrapper)
  const eventItems = element.querySelectorAll('.eventlist');
  if (eventItems.length > 0 && storyCards.length === 0) {
    eventItems.forEach((event) => {
      const row = [];

      // Date column
      const month = event.querySelector('.eventlistimagemonth');
      const day = event.querySelector('.eventlistimageday');
      const dateFrag = document.createDocumentFragment();
      if (month || day) {
        const pDate = document.createElement('p');
        const monthText = month ? month.textContent.trim() : '';
        const dayText = day ? day.textContent.trim() : '';
        pDate.textContent = `${monthText} ${dayText}`.trim();
        dateFrag.appendChild(pDate);
      }
      row.push(dateFrag);

      // Event details column
      const contentFrag = document.createDocumentFragment();
      const eventTitle = event.querySelector('.eventlisttext a, .eventlisttext .teaser-title');
      if (eventTitle) {
        const h3 = document.createElement('h3');
        if (eventTitle.href) {
          const a = document.createElement('a');
          a.href = eventTitle.href;
          a.textContent = eventTitle.textContent.trim();
          h3.appendChild(a);
        } else {
          h3.textContent = eventTitle.textContent.trim();
        }
        contentFrag.appendChild(h3);
      }

      const time = event.querySelector('.eventlisttime');
      if (time) {
        const pTime = document.createElement('p');
        pTime.textContent = time.textContent.trim();
        contentFrag.appendChild(pTime);
      }

      const location = event.querySelector('.eventlistlocation');
      if (location) {
        const pLoc = document.createElement('p');
        pLoc.textContent = location.textContent.trim();
        contentFrag.appendChild(pLoc);
      }

      row.push(contentFrag);
      cells.push(row);
    });
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards',
    cells,
  });

  element.replaceWith(block);
}
