/* eslint-disable */
/* global WebImporter */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove cookie consent banner (blocks content interaction)
    WebImporter.DOMUtils.remove(element, [
      '#cookie-banner',
      '.show-banner',
    ]);

    // Remove skip-to-content nav
    WebImporter.DOMUtils.remove(element, [
      'nav > a#skip-to-content-link',
    ]);

    // Remove scripts, noscript, iframes (tracking/analytics)
    WebImporter.DOMUtils.remove(element, [
      'script',
      'noscript',
      'iframe',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable global chrome
    WebImporter.DOMUtils.remove(element, [
      'header',
      '.core-header',
      '.inheritedreference',
      'footer',
      '.fatfooter',
      '.fatfooter-component',
      'nav.breadcrumbs',
      'nav[aria-label="breadcrumbs"]',
      '.breadcrumbs',
    ]);

    // Remove campaign/promo banner in footer area
    WebImporter.DOMUtils.remove(element, [
      '.campaign-banner',
      '[class*="ever-bold"]',
    ]);

    // Remove social media widgets and tracking pixels
    WebImporter.DOMUtils.remove(element, [
      '.socialbutton',
      'link',
      '[data-src*="facebook"]',
      '[data-src*="googletagmanager"]',
    ]);

    // Remove empty divs that have no meaningful content
    const emptyDivs = element.querySelectorAll('div:empty');
    emptyDivs.forEach((div) => {
      if (!div.id && !div.className) div.remove();
    });
  }
}
