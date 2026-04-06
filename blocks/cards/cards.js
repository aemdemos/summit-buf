import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation, getBlockId } from '../../scripts/scripts.js';
import { createCard } from '../card/card.js';

function parseEventData(li) {
  const bodies = li.querySelectorAll('.cards-card-body');
  if (bodies.length < 2) return null;

  const dateText = bodies[0].textContent.trim();
  const detailText = bodies[1].textContent.trim();
  const [month, day] = dateText.split(/\s+/);

  // Support pipe-delimited format: "blurb | time | location"
  const parts = detailText.split('|').map((s) => s.trim());
  let blurb = '';
  let time = '';
  let location = '';

  if (parts.length >= 3) {
    [blurb, time, location] = parts;
  } else if (parts.length === 2) {
    [blurb, time] = parts;
  } else {
    // Fallback: try to extract time directly from the text
    const timeMatch = detailText.match(/(\d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M)([^]*)/i);
    time = timeMatch ? timeMatch[1].trim() : '';
    location = timeMatch ? timeMatch[2].trim() : '';
  }

  return {
    month: month || '', day: day || '', blurb, time, location,
  };
}

function buildDateBox(data) {
  const dateBox = document.createElement('div');
  dateBox.className = 'cards-event-datebox';
  const monthSpan = document.createElement('span');
  monthSpan.className = 'cards-event-month';
  monthSpan.textContent = data.month;
  const daySpan = document.createElement('span');
  daySpan.className = 'cards-event-day';
  daySpan.textContent = data.day;
  dateBox.append(monthSpan, daySpan);
  return dateBox;
}

function buildDetails(data, { showBlurb = true } = {}) {
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'cards-event-details';
  if (showBlurb && data.blurb) {
    const blurbLine = document.createElement('p');
    blurbLine.className = 'cards-event-blurb';
    blurbLine.textContent = data.blurb;
    detailsDiv.append(blurbLine);
  }
  if (data.time) {
    const timeLine = document.createElement('p');
    timeLine.className = 'cards-event-time';
    timeLine.textContent = data.time;
    detailsDiv.append(timeLine);
  }
  if (data.location) {
    const locLine = document.createElement('p');
    locLine.className = 'cards-event-location';
    locLine.textContent = data.location;
    detailsDiv.append(locLine);
  }
  return detailsDiv;
}

function buildFeaturedCard(li, data) {
  li.textContent = '';
  const descDiv = document.createElement('div');
  descDiv.className = 'cards-event-desc';
  if (data.blurb) descDiv.textContent = data.blurb;
  li.append(descDiv);

  const bottomDiv = document.createElement('div');
  bottomDiv.className = 'cards-event-row';
  bottomDiv.append(buildDateBox(data), buildDetails(data, { showBlurb: false }));
  li.append(bottomDiv);
}

function buildEventCard(li, data) {
  li.textContent = '';
  li.classList.add('cards-event');
  const row = document.createElement('div');
  row.className = 'cards-event-row';
  row.append(buildDateBox(data), buildDetails(data));
  li.append(row);
}

function decorateEventCards(ul) {
  const lis = [...ul.children];
  const firstLi = lis[0];
  firstLi.style.gridRow = `1 / span ${lis.length - 1}`;
  firstLi.classList.add('cards-featured');

  const firstData = parseEventData(firstLi);
  if (firstData) buildFeaturedCard(firstLi, firstData);

  lis.slice(1).forEach((li) => {
    const data = parseEventData(li);
    if (data) buildEventCard(li, data);
  });
}

export default function decorate(block) {
  const blockId = getBlockId('cards');
  block.setAttribute('id', blockId);
  block.setAttribute('aria-label', `Cards for ${blockId}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Cards');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    ul.append(createCard(row));
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  // events cards (no images): structured event layout
  if (!ul.querySelector('.cards-card-image') && ul.children.length > 1) {
    decorateEventCards(ul);
  }
}
