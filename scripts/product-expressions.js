import { createExpression } from './expressions.js';
import { getCustomerNameOnly } from './utils.js';

const PRODUCT_PRICES = [1.95, 2.95, 3.95, 4.95, 5.95];

async function fetchProductPrice() {
  return new Promise((resolve) => {
    const index = Math.floor(Math.random() * PRODUCT_PRICES.length);
    setTimeout(() => resolve(PRODUCT_PRICES[index]), 300);
  });
}

// try using a helper function for attributes out of the existing "customer-data" table on the page
// test all of this against http://localhost:3000/customer-data/index page
async function fetchCseName() {
  return new Promise((resolve) => {
    // const name = 'Evan';
    // const csename = custName.search(/Evan/i) !== -1 ? 'Evan' : 'Customer Success Engineer';
    const custName = getCustomerNameOnly();
    const csename = custName.cseName !== -1 ? `${custName}` : 'Customer Success Engineer';
    setTimeout(() => resolve(csename), 300);
  });
}

createExpression('price', ({ args }) => {
  // get the sku and plan from the args
  const [sku, plan] = args.split(',');

  // create a span to hold the price
  const el = document.createElement('span');

  // fetch the price
  fetchProductPrice(sku, plan).then((price) => {
    el.innerText = `$${price}`;
  });

  // crete a value placeholder for the price (CLS friendly)
  el.innerText = 'loading...';

  return el;
});

createExpression('csename', ({ args }) => {
  // get the sku and plan from the args
  // const [customerName, cse] = args.split(',');

  // create a span to hold the price
  const el = document.createElement('span');

  // fetch the price
  // fetchProductPrice(sku, plan).then((price) => {
  fetchCseName().then((cseName) => {
    el.innerText = `${cseName}`;
  });

  // crete a value placeholder for the price (CLS friendly)
  el.innerText = 'loading...';

  return el;
});

createExpression('cta', ({ parent, args }) => {
  // get the first sibling that is a link
  const a = parent.nextElementSibling.querySelector('a');
  if (a === null) return;

  // get the first argument
  const [popup] = args.split(',');

  // style the link
  a.style.backgroundColor = 'red';

  if (popup) {
    // add a click handler
    a.addEventListener('click', (e) => {
      // eslint-disable-next-line no-alert
      alert('I am an alert box!');
      e.preventDefault();
    });
  }
});
