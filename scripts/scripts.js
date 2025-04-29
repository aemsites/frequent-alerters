import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

let hasFetchedCustomerData = false;

async function fetchCustomerData(customerId) {
  if (hasFetchedCustomerData) return; // prevent multiple fetches
  try {
    const response = await fetch('/all-customer-data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // make an array of the data from the rows
    let rows;
    if (Array.isArray(data)) {
      rows = data;
    } else if (data.rows) {
      rows = data.rows;
    } else if (data.data) {
      rows = data.data;
    } else {
      console.error('Unexpected JSON structure:', data);
      return;
    }
    // Find the row that matches the customerId
    const customerRow = rows.find((row) => row.customer_id === customerId);
    if (customerRow) {
      console.log('Customer data found:', customerRow);
      hasFetchedCustomerData = true;
    } else {
      console.log(`No data found for customer ID: ${customerId}`);
    }
  } catch (error) {
    console.error('Error fetching customer data:', error);
  }
}

export async function getDataByCustomerId() {
  const customerId = getMetadata('customer_id');
  // replace all instances of {customer_id} with the customerId
  const html = document.documentElement.innerHTML;
  let newHtml = html.replaceAll('{customer_id}', customerId);
  // Fetch customer data and replace all key/value pairs
  const customerData = await fetchCustomerData(customerId);
  if (customerData) {
    // Replace each key/value pair in the customer data
    Object.entries(customerData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        newHtml = newHtml.replaceAll(`{${key}}`, value);
      }
    });
  }
  document.documentElement.innerHTML = newHtml;
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }
  getDataByCustomerId(main); // need to call after body.appear
  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
