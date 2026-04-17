/*
 * Event Import Script
 * Fetches the latest event data from buffalo.edu using a headless browser
 * (events are client-side rendered) and updates the events cards block
 * in content/index.plain.html.
 *
 * Usage: node tools/importer/import-events.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const SOURCE_URL = 'https://www.buffalo.edu/';
const CONTENT_FILE = 'content/index.plain.html';

async function scrapeEvents() {
  console.log(`Navigating to ${SOURCE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/ms-playwright/chromium-1208/chrome-linux64/chrome',
  });
  const page = await browser.newPage();
  await page.goto(SOURCE_URL, { waitUntil: 'networkidle' });

  await page.waitForSelector('.eventlistblurb', { timeout: 15000 }).catch(() => {
    console.warn('Warning: eventlistblurb not found within timeout.');
  });

  const events = await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const links = document.querySelectorAll('.eventlist a[href*="calendar.buffalo.edu"]');

    links.forEach((link) => {
      const url = link.href;
      if (seen.has(url)) return;
      seen.add(url);

      const month = link.querySelector('.eventlistimagemonth')?.textContent?.trim() || '';
      const day = link.querySelector('.eventlistimageday')?.textContent?.trim() || '';

      const blurbEl = link.querySelector('.eventlistblurb');
      let blurb = '';
      if (blurbEl) {
        const clone = blurbEl.cloneNode(true);
        clone.querySelectorAll('.ada-hidden').forEach((h) => h.remove());
        blurb = clone.textContent.trim();
      }

      const locEl = link.querySelector('.eventlistlocation');
      let time = '';
      let location = '';
      if (locEl) {
        const html = locEl.innerHTML
          .replace(/<span class="eventlistlocation-date">[\s\S]*?<\/span>/i, '');
        const parts = html
          .split(/<br\s*\/?>/i)
          .map((s) => s.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean);
        if (parts.length >= 2) {
          [time, location] = parts;
        } else if (parts.length === 1) {
          [time] = parts;
        }
      }

      if (month && day) {
        results.push({
          url, month, day, blurb, time, location,
        });
      }
    });

    return results;
  });

  await browser.close();
  return events;
}

function buildCardsHTML(events) {
  const rows = events.map((evt) => {
    const datePart = `${evt.month} ${evt.day}`;
    const detailParts = [];
    if (evt.blurb) detailParts.push(evt.blurb);
    if (evt.time) detailParts.push(evt.time);
    if (evt.location) detailParts.push(evt.location);
    return `<div><div>${datePart}</div><div>${detailParts.join(' | ')}</div></div>`;
  });

  return `<div class="cards">${rows.join('')}</div>`;
}

function updateContent(content, newCardsHTML) {
  const lines = content.split('\n');
  const updated = [];
  let replaced = false;

  for (const line of lines) {
    if (!replaced && line.includes('<div class="cards">') && !line.includes('<img')) {
      updated.push(`<div>${newCardsHTML}<p><strong><a href="https://calendar.buffalo.edu/">See more events</a></strong></p></div>`);
      replaced = true;
      continue;
    }
    updated.push(line);
  }

  if (!replaced) {
    console.error('Could not find events cards block to update.');
    return content;
  }

  return updated.join('\n');
}

const events = await scrapeEvents();
console.log(`\nFound ${events.length} events:`);
events.forEach((evt) => {
  console.log(`  ${evt.month} ${evt.day} — ${evt.blurb || '(no title)'} — ${evt.time} ${evt.location}`);
});

if (events.length === 0) {
  console.error('No events found. Aborting.');
  process.exit(1);
}

const newCardsHTML = buildCardsHTML(events);

const contentPath = resolve(process.cwd(), CONTENT_FILE);
console.log(`\nUpdating ${contentPath}...`);
const content = readFileSync(contentPath, 'utf-8');
const updated = updateContent(content, newCardsHTML);

if (updated === content) {
  console.log('No changes needed.');
} else {
  writeFileSync(contentPath, updated, 'utf-8');
  console.log('Content updated successfully.');
}
