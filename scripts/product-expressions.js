import { createExpression } from './expressions.js';

const PRODUCT_PRICES = [1.95, 2.95, 3.95, 4.95, 5.95];

async function fetchProductPrice() {
  return new Promise((resolve) => {
    const index = Math.floor(Math.random() * PRODUCT_PRICES.length);
    setTimeout(() => resolve(PRODUCT_PRICES[index]), 300);
  });
}

async function fetchCseName() {
  const name = 'Evan';
  return name;
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

createExpression('CSE_NAME', ({ args }) => {
  // get the sku and plan from the args
  const [customerName] = args.split(',');

  // create a span to hold the price
  const el = document.createElement('span');

  // fetch the price
  // fetchProductPrice(sku, plan).then((price) => {
  fetchCseName(customerName).then((cseName) => {
    el.innerText = `$${cseName}`;
  });

  // crete a value placeholder for the price (CLS friendly)
  el.innerText = 'loading...';

  return el;
});
