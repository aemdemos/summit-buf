import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

// EDS wraps links in <p> tags; this finds the first <a> whether direct child or in <p>
function getDirectLink(el) {
  return el.querySelector(':scope > a') || el.querySelector(':scope > p > a');
}

function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-megamenu-panel').forEach((p) => {
    p.setAttribute('aria-hidden', 'true');
  });
  nav.querySelectorAll('.nav-sections .nav-item').forEach((item) => {
    item.classList.remove('active');
    item.setAttribute('aria-expanded', 'false');
  });
}

function toggleMenu(nav, forceExpanded = null) {
  const wasExpanded = nav.getAttribute('aria-expanded') === 'true';
  const shouldExpand = forceExpanded !== null ? forceExpanded : !wasExpanded;
  const button = nav.querySelector('.nav-hamburger button');

  if (isDesktop.matches) {
    // Desktop: always collapsed mobile menu
    nav.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
    if (button) button.setAttribute('aria-label', 'Open navigation');
    return;
  }

  // Mobile toggle
  document.body.style.overflowY = shouldExpand ? 'hidden' : '';
  nav.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
  if (button) {
    button.setAttribute('aria-label', shouldExpand ? 'Close navigation' : 'Open navigation');
  }
  if (!shouldExpand) closeAllPanels(nav);
}

function buildFeaturedColumn(featured) {
  const col = document.createElement('div');
  col.className = 'megamenu-featured-col';
  const innerList = featured.querySelector('ul');
  if (innerList) {
    const imgLink = innerList.querySelector('a:has(img)');
    if (imgLink) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'megamenu-featured-image';
      imgWrap.append(imgLink.cloneNode(true));
      col.append(imgWrap);
    }
    const textLi = [...innerList.children].find(
      (li) => !li.querySelector('a') && li.textContent.trim().length > 0,
    );
    if (textLi) {
      const p = document.createElement('p');
      p.className = 'megamenu-featured-text';
      p.textContent = textLi.textContent.trim();
      col.append(p);
    }
  }
  return col;
}

function buildCategoryColumn(cat) {
  const col = document.createElement('div');
  col.className = 'megamenu-column';
  const catHeading = getDirectLink(cat);
  if (catHeading) {
    const h3 = document.createElement('h3');
    h3.className = 'megamenu-category-heading';
    h3.append(catHeading.cloneNode(true));
    col.append(h3);
  }
  const catList = cat.querySelector('ul');
  if (catList) {
    const ul = document.createElement('ul');
    ul.className = 'megamenu-links';
    [...catList.children].forEach((linkLi) => {
      const li = document.createElement('li');
      const a = linkLi.querySelector('a');
      if (a) {
        if (a.classList.contains('cta-button')) {
          const ctaWrap = document.createElement('div');
          ctaWrap.className = 'megamenu-cta';
          ctaWrap.append(a.cloneNode(true));
          col.append(ctaWrap);
        } else if (a.querySelector('img')) {
          const imgWrap = document.createElement('div');
          imgWrap.className = 'megamenu-column-image';
          imgWrap.append(a.cloneNode(true));
          col.append(imgWrap);
        } else {
          li.append(a.cloneNode(true));
          ul.append(li);
        }
      }
    });
    if (ul.children.length > 0) col.append(ul);
  }
  return col;
}

function shiftColumnImages(row) {
  const colImages = row.querySelectorAll('.megamenu-column-image');
  if (colImages.length === 0) return;
  const featuredImg = row.querySelector('.megamenu-featured-image');
  const allImages = [];
  if (featuredImg) allImages.push(featuredImg);
  colImages.forEach((img) => allImages.push(img));
  const catCols = row.querySelectorAll('.megamenu-column');
  allImages.forEach((img) => img.remove());
  allImages.forEach((img, i) => {
    if (i < catCols.length) {
      img.className = 'megamenu-column-image';
      const heading = catCols[i].querySelector('.megamenu-category-heading');
      if (heading) {
        heading.after(img);
      } else {
        catCols[i].prepend(img);
      }
    }
  });
}

function buildMegamenuPanel(subList) {
  const panel = document.createElement('div');
  panel.className = 'nav-megamenu-panel';
  panel.setAttribute('aria-hidden', 'true');

  const items = [...subList.children];
  const featured = items[0];
  const categories = items.filter((li, i) => i > 0 && !li.classList.contains('also-interested'));
  const alsoInterested = items.find((li) => li.classList.contains('also-interested'));
  const regularCats = categories.filter((cat) => !cat.classList.contains('sidebar-card'));
  const sidebarCats = categories.filter((cat) => cat.classList.contains('sidebar-card'));
  const hasSidebar = sidebarCats.length > 0;

  if (hasSidebar) panel.classList.add('has-sidebar');

  // Panel header (the blue title link) — always at top
  if (featured) {
    const headerLink = getDirectLink(featured);
    if (headerLink) {
      const h = document.createElement('div');
      h.className = 'megamenu-header';
      h.append(headerLink.cloneNode(true));
      panel.append(h);
    }
  }

  if (!hasSidebar) {
    // Layout A: single row — [featured-col] [cat-col1] [cat-col2] ...
    const row = document.createElement('div');
    row.className = 'megamenu-columns';
    if (featured) row.append(buildFeaturedColumn(featured));
    regularCats.forEach((cat) => row.append(buildCategoryColumn(cat)));

    // Shift images right when category columns contain images (e.g. Life at UB):
    // featured image → col 1 top, col 1 image → col 2 top, col 2 image → col 3 top
    shiftColumnImages(row);

    panel.append(row);
  } else {
    // Layout B: left content (featured + link sub-cols) | right sidebar card
    const leftContent = document.createElement('div');
    leftContent.className = 'megamenu-left';
    if (featured) leftContent.append(buildFeaturedColumn(featured));
    const subCols = document.createElement('div');
    subCols.className = 'megamenu-columns';
    regularCats.forEach((cat) => subCols.append(buildCategoryColumn(cat)));
    leftContent.append(subCols);
    panel.append(leftContent);
  }

  // Sidebar cards (blue header bar + card styling)
  sidebarCats.forEach((cat) => {
    const card = document.createElement('div');
    card.className = 'megamenu-sidebar-card';
    const catHeading = getDirectLink(cat);
    if (catHeading) {
      const header = document.createElement('div');
      header.className = 'megamenu-sidebar-header';
      header.append(catHeading.cloneNode(true));
      card.append(header);
    }
    const catList = cat.querySelector('ul');
    if (catList) {
      const body = document.createElement('div');
      body.className = 'megamenu-sidebar-body';
      [...catList.children].forEach((linkLi) => {
        const item = document.createElement('div');
        item.className = 'megamenu-sidebar-item';
        const strong = linkLi.querySelector('strong');
        const a = linkLi.querySelector('a');
        if (strong) {
          const labelEl = document.createElement('span');
          labelEl.className = 'megamenu-sidebar-label';
          labelEl.textContent = strong.textContent;
          item.append(labelEl);
        }
        if (a) {
          item.append(a.cloneNode(true));
        } else if (!strong) {
          const textEl = document.createElement('span');
          textEl.className = 'megamenu-sidebar-text';
          textEl.textContent = linkLi.textContent.trim();
          item.append(textEl);
        }
        body.append(item);
      });
      card.append(body);
    }
    panel.append(card);
  });

  // Also interested footer
  if (alsoInterested) {
    const footer = document.createElement('div');
    footer.className = 'megamenu-footer';
    const label = document.createElement('span');
    label.className = 'megamenu-footer-label';
    label.textContent = 'YOU MAY ALSO BE INTERESTED IN:';
    footer.append(label);
    const links = alsoInterested.querySelectorAll('a');
    links.forEach((a) => {
      footer.append(a.cloneNode(true));
    });
    panel.append(footer);
  }

  return panel;
}

function buildInfoForDropdown(toolsUl) {
  const infoForLi = [...toolsUl.children].find((li) => {
    const a = getDirectLink(li);
    return a && a.textContent.trim() === 'Info For';
  });
  if (!infoForLi) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-info-for';
  const trigger = document.createElement('button');
  trigger.className = 'nav-info-for-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  const triggerLabel = document.createElement('span');
  triggerLabel.textContent = 'Info For';
  trigger.append(triggerLabel);
  wrapper.append(trigger);

  const dropdown = document.createElement('div');
  dropdown.className = 'nav-info-for-dropdown';
  dropdown.setAttribute('aria-hidden', 'true');
  const subList = infoForLi.querySelector('ul');
  if (subList) {
    const ul = document.createElement('ul');
    [...subList.children].forEach((li) => {
      const a = li.querySelector('a');
      if (a) {
        const newLi = document.createElement('li');
        newLi.append(a.cloneNode(true));
        ul.append(newLi);
      }
    });
    dropdown.append(ul);
  }
  wrapper.append(dropdown);

  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    dropdown.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
  });

  wrapper.addEventListener('mouseenter', () => {
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.setAttribute('aria-hidden', 'false');
  });
  wrapper.addEventListener('mouseleave', () => {
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.setAttribute('aria-hidden', 'true');
  });

  return wrapper;
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  // loadFragment returns a <main> with decorated sections; grab section children
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);
  const allSections = [...nav.children];
  const classes = ['brand', 'sections', 'tools'];
  allSections.forEach((section, i) => {
    if (i < classes.length) section.classList.add(`nav-${classes[i]}`);
  });

  // Hamburger
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  const hamburgerBtn = document.createElement('button');
  hamburgerBtn.type = 'button';
  hamburgerBtn.setAttribute('aria-controls', 'nav');
  hamburgerBtn.setAttribute('aria-label', 'Open navigation');
  const hamburgerIcon = document.createElement('span');
  hamburgerIcon.className = 'nav-hamburger-icon';
  hamburgerBtn.append(hamburgerIcon);
  hamburger.append(hamburgerBtn);
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.append(hamburger);

  // Sections (main nav with megamenu)
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const sectionsList = navSections.querySelector('ul');
    if (sectionsList) {
      const navItemsContainer = document.createElement('div');
      navItemsContainer.className = 'nav-items';
      [...sectionsList.children].forEach((li) => {
        const topLink = getDirectLink(li);
        const subList = li.querySelector(':scope > ul');
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        navItem.setAttribute('aria-expanded', 'false');

        if (topLink) {
          const linkEl = topLink.cloneNode(true);
          linkEl.className = 'nav-item-link';
          navItem.append(linkEl);

          // Chevron for mobile
          const chevron = document.createElement('button');
          chevron.className = 'nav-item-chevron';
          chevron.setAttribute('aria-label', `Expand ${topLink.textContent.trim()}`);
          chevron.append(document.createElement('span'));
          navItem.append(chevron);
        }

        if (subList) {
          const panel = buildMegamenuPanel(subList);
          navItem.append(panel);

          // Desktop: hover to open
          navItem.addEventListener('mouseenter', () => {
            if (!isDesktop.matches) return;
            closeAllPanels(nav);
            navItem.classList.add('active');
            navItem.setAttribute('aria-expanded', 'true');
            panel.setAttribute('aria-hidden', 'false');
          });
          navItem.addEventListener('mouseleave', () => {
            if (!isDesktop.matches) return;
            navItem.classList.remove('active');
            navItem.setAttribute('aria-expanded', 'false');
            panel.setAttribute('aria-hidden', 'true');
          });

          // Mobile: chevron click to toggle
          const chevron = navItem.querySelector('.nav-item-chevron');
          if (chevron) {
            chevron.addEventListener('click', (e) => {
              e.stopPropagation();
              if (isDesktop.matches) return;
              const isOpen = navItem.getAttribute('aria-expanded') === 'true';
              closeAllPanels(nav);
              if (!isOpen) {
                navItem.classList.add('active');
                navItem.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
              }
            });
          }
        }

        navItemsContainer.append(navItem);
      });
      navSections.textContent = '';
      navSections.append(navItemsContainer);
    }
    nav.append(navSections);
  }

  // Search
  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'nav-search';

  const searchToggleBtn = document.createElement('button');
  searchToggleBtn.className = 'nav-search-toggle';
  searchToggleBtn.setAttribute('aria-label', 'Search');
  searchToggleBtn.setAttribute('aria-expanded', 'false');
  const searchIcon = document.createElement('span');
  searchIcon.className = 'icon icon-search';
  searchToggleBtn.append(searchIcon);

  const searchPanel = document.createElement('div');
  searchPanel.className = 'nav-search-panel';
  searchPanel.setAttribute('aria-hidden', 'true');
  const searchForm = document.createElement('form');
  searchForm.setAttribute('role', 'search');
  searchForm.setAttribute('action', 'https://www.buffalo.edu/search/');
  searchForm.setAttribute('method', 'get');
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.name = 'q';
  searchInput.placeholder = 'Search';
  searchInput.setAttribute('aria-label', 'Search');
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.setAttribute('aria-label', 'Submit search');
  const submitIcon = document.createElement('span');
  submitIcon.className = 'icon icon-search';
  submitBtn.append(submitIcon);
  searchForm.append(searchInput, submitBtn);
  searchPanel.append(searchForm);
  searchWrapper.append(searchToggleBtn, searchPanel);
  searchToggleBtn.addEventListener('click', () => {
    const isOpen = searchToggleBtn.getAttribute('aria-expanded') === 'true';
    searchToggleBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    searchPanel.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    if (!isOpen) searchInput.focus();
  });
  searchWrapper.addEventListener('mouseenter', () => {
    if (!isDesktop.matches) return;
    searchToggleBtn.setAttribute('aria-expanded', 'true');
    searchPanel.setAttribute('aria-hidden', 'false');
  });
  searchWrapper.addEventListener('mouseleave', () => {
    if (!isDesktop.matches) return;
    searchToggleBtn.setAttribute('aria-expanded', 'false');
    searchPanel.setAttribute('aria-hidden', 'true');
  });
  nav.append(searchWrapper);

  // Tools (Info For + CTAs)
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolsContainer = document.createElement('div');
    toolsContainer.className = 'nav-tools';
    const toolsUl = navTools.querySelector('ul');
    if (toolsUl) {
      const infoFor = buildInfoForDropdown(toolsUl);
      if (infoFor) toolsContainer.append(infoFor);

      // CTA buttons (Apply, Give)
      const ctaContainer = document.createElement('div');
      ctaContainer.className = 'nav-cta-buttons';
      [...toolsUl.children].forEach((li) => {
        const a = getDirectLink(li);
        if (a && a.textContent.trim() !== 'Info For' && !li.querySelector('ul')) {
          const ctaLink = a.cloneNode(true);
          ctaLink.className = 'nav-cta';
          ctaContainer.append(ctaLink);
        }
      });
      if (ctaContainer.children.length > 0) toolsContainer.append(ctaContainer);
    }
    nav.append(toolsContainer);
  }

  // Escape key closes everything
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPanels(nav);
      if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
        toggleMenu(nav, false);
      }
    }
  });

  // Viewport resize handling
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    toggleMenu(nav, isDesktop.matches);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Initialize
  toggleMenu(nav, isDesktop.matches);
}
