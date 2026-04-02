var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel.js
  function parse(element, { document }) {
    const cells = [];
    const slides = element.querySelectorAll(".slide, .faces-voices-slide");
    slides.forEach((slide) => {
      const row = [];
      const img = slide.querySelector("img");
      if (img) {
        const picture = img.closest("picture") || img;
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:backgroundImage "));
        frag.appendChild(picture.cloneNode(true));
        row.push(frag);
      } else {
        row.push("");
      }
      const titleEl = slide.querySelector(".teaser-title span, .teaser-title, .fv-quote, blockquote");
      const nameEl = slide.querySelector(".fv-name, .fv-attribution, p");
      const contentFrag = document.createDocumentFragment();
      contentFrag.appendChild(document.createComment(" field:content "));
      if (titleEl) {
        const p = document.createElement("p");
        p.textContent = titleEl.textContent.trim();
        contentFrag.appendChild(p);
      }
      if (nameEl && nameEl !== titleEl) {
        const pName = document.createElement("p");
        pName.textContent = nameEl.textContent.trim();
        contentFrag.appendChild(pName);
      }
      row.push(contentFrag);
      cells.push(row);
    });
    if (cells.length === 0) {
      const teasers = element.querySelectorAll(".teaser");
      teasers.forEach((teaser) => {
        const row = [];
        const img = teaser.querySelector("img");
        if (img) {
          const picture = img.closest("picture") || img;
          const frag = document.createDocumentFragment();
          frag.appendChild(document.createComment(" field:backgroundImage "));
          frag.appendChild(picture.cloneNode(true));
          row.push(frag);
        } else {
          row.push("");
        }
        const title = teaser.querySelector(".teaser-title");
        const contentFrag = document.createDocumentFragment();
        contentFrag.appendChild(document.createComment(" field:content "));
        if (title) {
          const p = document.createElement("p");
          p.textContent = title.textContent.trim();
          contentFrag.appendChild(p);
        }
        row.push(contentFrag);
        cells.push(row);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "carousel",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse2(element, { document }) {
    const cells = [];
    const storyCards = element.querySelectorAll("li .teaser");
    if (storyCards.length > 0) {
      storyCards.forEach((card) => {
        const row = [];
        const img = card.querySelector("img");
        if (img) {
          const picture = img.closest("picture") || img;
          row.push(picture.cloneNode(true));
        } else {
          row.push("");
        }
        const contentFrag = document.createDocumentFragment();
        const category = card.querySelector(".teaser-story-category");
        if (category) {
          const pCat = document.createElement("p");
          pCat.textContent = category.textContent.trim();
          contentFrag.appendChild(pCat);
        }
        const title = card.querySelector(".teaser-title");
        const link = card.querySelector("a.teaser-primary-anchor");
        if (title) {
          const heading = document.createElement("h3");
          if (link && link.href) {
            const a = document.createElement("a");
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
    const eventItems = element.querySelectorAll(".eventlist");
    if (eventItems.length > 0 && storyCards.length === 0) {
      eventItems.forEach((event) => {
        const row = [];
        const month = event.querySelector(".eventlistimagemonth");
        const day = event.querySelector(".eventlistimageday");
        const dateFrag = document.createDocumentFragment();
        if (month || day) {
          const pDate = document.createElement("p");
          const monthText = month ? month.textContent.trim() : "";
          const dayText = day ? day.textContent.trim() : "";
          pDate.textContent = `${monthText} ${dayText}`.trim();
          dateFrag.appendChild(pDate);
        }
        row.push(dateFrag);
        const contentFrag = document.createDocumentFragment();
        const eventTitle = event.querySelector(".eventlisttext a, .eventlisttext .teaser-title");
        if (eventTitle) {
          const h3 = document.createElement("h3");
          if (eventTitle.href) {
            const a = document.createElement("a");
            a.href = eventTitle.href;
            a.textContent = eventTitle.textContent.trim();
            h3.appendChild(a);
          } else {
            h3.textContent = eventTitle.textContent.trim();
          }
          contentFrag.appendChild(h3);
        }
        const time = event.querySelector(".eventlisttime");
        if (time) {
          const pTime = document.createElement("p");
          pTime.textContent = time.textContent.trim();
          contentFrag.appendChild(pTime);
        }
        const location = event.querySelector(".eventlistlocation");
        if (location) {
          const pLoc = document.createElement("p");
          pLoc.textContent = location.textContent.trim();
          contentFrag.appendChild(pLoc);
        }
        row.push(contentFrag);
        cells.push(row);
      });
    }
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse3(element, { document }) {
    const cells = [];
    const statContainers = element.querySelectorAll(".container > .core-text, .container > .text");
    const row = [];
    statContainers.forEach((stat) => {
      const frag = document.createDocumentFragment();
      const boldEl = stat.querySelector("b, strong");
      if (boldEl) {
        const pNum = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = boldEl.textContent.trim();
        pNum.appendChild(strong);
        frag.appendChild(pNum);
      }
      const fullText = stat.textContent.trim();
      const boldText = boldEl ? boldEl.textContent.trim() : "";
      const descText = fullText.replace(boldText, "").trim();
      if (descText) {
        const pDesc = document.createElement("p");
        pDesc.textContent = descText;
        frag.appendChild(pDesc);
      }
      row.push(frag);
    });
    if (row.length === 0) {
      const paragraphs = element.querySelectorAll("p");
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
      name: "columns",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero.js
  function parse4(element, { document }) {
    const cells = [];
    const img = element.querySelector(".hero-video-wrapper img, .hero-video-wrapper .bg, video");
    const imageFrag = document.createDocumentFragment();
    imageFrag.appendChild(document.createComment(" field:image "));
    if (img && img.tagName === "IMG") {
      const picture = img.closest("picture") || img;
      imageFrag.appendChild(picture.cloneNode(true));
    } else {
      const videoEl = element.querySelector("video[poster]");
      const bgEl = element.querySelector(".hero-video-wrapper .bg, .hero-video-wrapper");
      if (videoEl && videoEl.poster) {
        const newImg = document.createElement("img");
        newImg.src = videoEl.poster;
        newImg.alt = "Background video still";
        imageFrag.appendChild(newImg);
      } else if (bgEl) {
        const p = document.createElement("p");
        p.textContent = "(background video)";
        imageFrag.appendChild(p);
      }
    }
    cells.push([imageFrag]);
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(" field:text "));
    const heading = element.querySelector("h3, h2, h1, .title");
    if (heading) {
      const h2 = document.createElement("h2");
      h2.textContent = heading.textContent.trim();
      textFrag.appendChild(h2);
    }
    const buttons = element.querySelectorAll("#tlw-video-cta a, .core-button a, .buttoncomponent a");
    buttons.forEach((btn) => {
      if (btn.href && btn.textContent.trim()) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = btn.href;
        a.textContent = btn.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
      }
    });
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "hero",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/buffalo-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#cookie-banner",
        ".show-banner"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "nav > a#skip-to-content-link"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "noscript",
        "iframe"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        ".core-header",
        ".inheritedreference",
        "footer",
        ".fatfooter",
        ".fatfooter-component",
        "nav.breadcrumbs",
        'nav[aria-label="breadcrumbs"]',
        ".breadcrumbs"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".campaign-banner",
        '[class*="ever-bold"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".socialbutton",
        "link",
        '[data-src*="facebook"]',
        '[data-src*="googletagmanager"]'
      ]);
      const emptyDivs = element.querySelectorAll("div:empty");
      emptyDivs.forEach((div) => {
        if (!div.id && !div.className) div.remove();
      });
    }
  }

  // tools/importer/transformers/buffalo-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    var _a;
    if (hookName === TransformHook2.afterTransform) {
      const { document } = payload;
      const sections = (_a = payload.template) == null ? void 0 : _a.sections;
      if (!sections || sections.length < 2) return;
      const reversedSections = [...sections].reverse();
      reversedSections.forEach((section) => {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) return;
        if (section.style) {
          const sectionMetadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(sectionMetadata);
        }
        const previousSibling = sectionEl.previousElementSibling;
        if (previousSibling) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      });
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel": parse,
    "cards": parse2,
    "columns": parse3,
    "hero": parse4
  };
  var transformers = [
    transform
  ];
  var sectionTransformers = [
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "University at Buffalo main homepage with hero slideshow, program finder, news stories, events, testimonials, stats, and video CTA",
    urls: [
      "https://www.buffalo.edu/"
    ],
    blocks: [
      {
        name: "carousel",
        instances: [
          "#randomized-slideshow",
          "div.facesvoiceshero.carousel"
        ]
      },
      {
        name: "cards",
        instances: [
          "ul.list-style-teaser-grid-story",
          "#events-wrapper"
        ]
      },
      {
        name: "columns",
        instances: [
          "#stats-table"
        ]
      },
      {
        name: "hero",
        instances: [
          "#tlw-video"
        ]
      }
    ],
    sections: [
      {
        id: "section-hero",
        name: "Hero Slideshow",
        selector: "#randomized-slideshow",
        style: null,
        blocks: ["carousel"],
        defaultContent: []
      },
      {
        id: "section-programs",
        name: "Find Your Program",
        selector: "#findYourProgram",
        style: null,
        blocks: [],
        defaultContent: ["h2#hpProgramsTitle", "#hpProgramsRight p", "#findYourProgram-ctaButtons .core-button a"]
      },
      {
        id: "section-news",
        name: "News Stories Grid",
        selector: "ul.list-style-teaser-grid-story",
        style: "ub-blue",
        blocks: ["cards"],
        defaultContent: []
      },
      {
        id: "section-research",
        name: "Research Impact",
        selector: "div.flagship.how",
        style: null,
        blocks: [],
        defaultContent: ["div.flagship.how h2.flagship-title"]
      },
      {
        id: "section-events",
        name: "Events",
        selector: "#events-and-faces-voices",
        style: null,
        blocks: ["cards", "carousel"],
        defaultContent: ["#events-wrapper a[href*='calendar.buffalo.edu']"]
      },
      {
        id: "section-stats",
        name: "Statistics",
        selector: "#stats-table",
        style: "ub-blue",
        blocks: ["columns"],
        defaultContent: ["#stats-table .core-button a"]
      },
      {
        id: "section-video",
        name: "Video CTA",
        selector: "#tlw-video",
        style: "ub-blue",
        blocks: ["hero"],
        defaultContent: []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
