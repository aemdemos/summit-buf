/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselParser from './parsers/carousel.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';
import heroParser from './parsers/hero.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/buffalo-cleanup.js';
import sectionsTransformer from './transformers/buffalo-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel': carouselParser,
  'cards': cardsParser,
  'columns': columnsParser,
  'hero': heroParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
];

// Section transformer added conditionally based on template sections
const sectionTransformers = [
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'University at Buffalo main homepage with hero slideshow, program finder, news stories, events, testimonials, stats, and video CTA',
  urls: [
    'https://www.buffalo.edu/',
  ],
  blocks: [
    {
      name: 'carousel',
      instances: [
        '#randomized-slideshow',
        'div.facesvoiceshero.carousel',
      ],
    },
    {
      name: 'cards',
      instances: [
        'ul.list-style-teaser-grid-story',
        '#events-wrapper',
      ],
    },
    {
      name: 'columns',
      instances: [
        '#stats-table',
      ],
    },
    {
      name: 'hero',
      instances: [
        '#tlw-video',
      ],
    },
  ],
  sections: [
    {
      id: 'section-hero',
      name: 'Hero Slideshow',
      selector: '#randomized-slideshow',
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'section-programs',
      name: 'Find Your Program',
      selector: '#findYourProgram',
      style: null,
      blocks: [],
      defaultContent: ['h2#hpProgramsTitle', '#hpProgramsRight p', '#findYourProgram-ctaButtons .core-button a'],
    },
    {
      id: 'section-news',
      name: 'News Stories Grid',
      selector: 'ul.list-style-teaser-grid-story',
      style: 'ub-blue',
      blocks: ['cards'],
      defaultContent: [],
    },
    {
      id: 'section-research',
      name: 'Research Impact',
      selector: 'div.flagship.how',
      style: null,
      blocks: [],
      defaultContent: ['div.flagship.how h2.flagship-title'],
    },
    {
      id: 'section-events',
      name: 'Events',
      selector: '#events-and-faces-voices',
      style: null,
      blocks: ['cards', 'carousel'],
      defaultContent: ["#events-wrapper a[href*='calendar.buffalo.edu']"],
    },
    {
      id: 'section-stats',
      name: 'Statistics',
      selector: '#stats-table',
      style: 'ub-blue',
      blocks: ['columns'],
      defaultContent: ['#stats-table .core-button a'],
    },
    {
      id: 'section-video',
      name: 'Video CTA',
      selector: '#tlw-video',
      style: 'ub-blue',
      blocks: ['hero'],
      defaultContent: [],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });

  // Run section transformers only if template has 2+ sections
  if (PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1) {
    sectionTransformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Section transformer failed at ${hookName}:`, e);
      }
    });
  }
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform (cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
