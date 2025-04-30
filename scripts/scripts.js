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
let hasProcessedCustomerData = false;
let hasFetchedTopTenData = false;

async function fetchCustomerData(customerId) {
  if (hasFetchedCustomerData) return null;
  try {
    const response = await fetch('/all-customer-data.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.rows || data.data || [];
    const customerRow = rows.find((row) => row.customer_id === customerId);
    if (customerRow) {
      console.log('Customer data found:', customerRow);
      hasFetchedCustomerData = true;
      return customerRow;
    }
    console.log(`No data found for customer ID: ${customerId}`);
    return null;
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return null;
  }
}

async function fetchTopTenData() {
  if (hasFetchedTopTenData) return null;
  try {
    const response = await fetch('/power-bi-2025-q1-top10.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.rows || data.data || [];
    if (rows && rows.length > 0) {
      console.log('Top 10 data found:', rows);
      hasFetchedTopTenData = true;
      return rows;
    }
    console.log('No data found for Top 10');
    return null;
  } catch (error) {
    console.error('Error fetching Top 10 data:', error);
    return null;
  }
}

export async function getDataByCustomerId() {
  if (hasProcessedCustomerData) return;
  const customerId = getMetadata('customer_id');
  const main = document.querySelector('main');
  let newHtml = main.innerHTML.replaceAll('{customer_id}', customerId);
  const customerData = await fetchCustomerData(customerId);
  if (customerData) {
    // Replace each key/value pair in the customer data
    Object.entries(customerData).forEach(([key, value]) => {
      if (value != null) {
        newHtml = newHtml.replaceAll(`{${key}}`, value);
      }
    });
  }
  main.innerHTML = newHtml;
  hasProcessedCustomerData = true;
}

export async function getDataForTopTenTable() {
  try {
    // Fetch the Top 10 data
    const topTenData = await fetchTopTenData();

    // Check if data exists
    if (!topTenData || topTenData.length === 0) {
      console.log('No Top 10 data available to display.');
      return;
    }

    // Create a table element
    const table = document.createElement('table');
    table.classList.add('top10-table');

    // Generate table headers based on the keys of the first row
    const headers = Object.keys(topTenData[0]);
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach((header) => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Generate table rows for each data entry
    const tbody = document.createElement('tbody');
    topTenData.forEach((row) => {
      const tr = document.createElement('tr');
      Object.values(row).forEach((value) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Replace the literal string "{top_10}" with the generated table
    const main = document.querySelector('main');
    if (main) {
      const placeholder = main.innerHTML.indexOf('{top10}');
      if (placeholder !== -1) {
        main.innerHTML = main.innerHTML.replace('{top10}', table.outerHTML);
      } else {
        console.error('Placeholder "{top_10}" not found in the main element.');
      }
    } else {
      console.error('Main element not found. Cannot append the Top 10 table.');
    }
  } catch (error) {
    console.error('Error generating Top 10 table:', error);
  }
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
  getDataByCustomerId(main);
  getDataForTopTenTable(main);
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
