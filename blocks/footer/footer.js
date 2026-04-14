import { decorateIcons } from '../../scripts/aem.js';

/**
 * Maps social link text to icon names.
 * @param {string} text Link text
 * @returns {string|null} Icon name or null
 */
function getSocialIconName(text) {
  const normalized = text.toLowerCase().trim();
  const map = {
    facebook: 'facebook',
    instagram: 'instagram',
    linkedin: 'linkedin',
    tiktok: 'tiktok',
    twitter: 'twitter',
    youtube: 'youtube',
  };
  const match = Object.keys(map).find((key) => normalized.includes(key));
  return match ? map[match] : null;
}

/**
 * Decorates social media links with icon spans.
 * @param {HTMLElement} container Element containing social links
 */
function decorateSocialIcons(container) {
  const socialParagraph = [...container.querySelectorAll('p')].find((p) => {
    const links = p.querySelectorAll('a');
    if (links.length < 3) return false;
    return [...links].some((a) => getSocialIconName(a.textContent));
  });
  if (!socialParagraph) return;
  socialParagraph.classList.add('footer-social-icons');
  socialParagraph.querySelectorAll('a').forEach((a) => {
    const iconName = getSocialIconName(a.textContent);
    if (iconName) {
      const span = document.createElement('span');
      span.className = `icon icon-${iconName}`;
      a.textContent = '';
      a.appendChild(span);
      a.setAttribute('aria-label', `UB ${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`);
    }
  });
}

/**
 * Loads and decorates the footer.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = document.querySelector('meta[name="footer"]');
  const footerPath = footerMeta ? new URL(footerMeta.content, window.location).pathname : '/footer';

  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return;

  const html = await resp.text();
  const fragment = document.createElement('div');
  fragment.innerHTML = html;

  const sections = fragment.querySelectorAll(':scope > div');
  const linkColumnsSection = document.createElement('div');
  linkColumnsSection.className = 'footer-columns';

  const bottomSection = document.createElement('div');
  bottomSection.className = 'footer-bottom';

  sections.forEach((section, index) => {
    if (index < 4) {
      const column = document.createElement('div');
      column.className = 'footer-column';
      column.append(...section.childNodes);
      decorateSocialIcons(column);
      linkColumnsSection.appendChild(column);
    } else {
      bottomSection.append(...section.childNodes);
    }
  });

  // Identify contact button in bottom section
  const contactLink = bottomSection.querySelector('a[href*="contact"]');
  if (contactLink && contactLink.closest('p')?.children.length === 1) {
    contactLink.classList.add('footer-contact-btn');
  }

  // Identify copyright paragraph
  const paragraphs = bottomSection.querySelectorAll('p');
  paragraphs.forEach((p) => {
    if (p.textContent.includes('\u00A9') || p.textContent.includes('©')) {
      p.classList.add('footer-copyright');
    }
  });

  block.textContent = '';
  block.appendChild(linkColumnsSection);
  block.appendChild(bottomSection);

  await decorateIcons(block);
}
