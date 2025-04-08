/* eslint-disable max-len */
import { getCustomerData } from '../../scripts/utils.js';

export default async function decorate(block) {
  try {
    const customerDataObjects = await getCustomerData();
    console.error('Customer data objects:', customerDataObjects);
    const customerDataBlock = block.querySelector('div');
    console.error('Customer data block:', customerDataBlock);
    if (!customerDataBlock) {
      console.error('No customer data block found');
      return;
    }
    const customerData = block.querySelector('p').innerText;
    const customerDataList = customerData.split(',');
    block.innerHTML = '';

    customerDataList.forEach((customerDataItem) => {
      const customerDataObject = customerDataObjects.find((customerDataObj) => customerDataObj.customer_id.toLowerCase() === customerDataItem.toLowerCase().trim());
      if (customerDataObject) {
        if (customerDataList.length === 1 && customerDataObject.image) {
          block.innerHTML += customerDataObject.outerHTML;
        }
        if (customerDataList.indexOf(customerDataItem) === 0) {
          block.innerHTML += '<p> Customer details </p>';
        }
        block.innerHTML += `<a href="${customerDataObject.path}">${customerDataObject.customer_id}</a>${customerDataObject.alert_message}`;
        if (customerDataList.indexOf(customerDataItem) < customerDataList.length - 1) {
          block.innerHTML += '; ';
        }
      }
    });

    const children = Array.from(block.childNodes);
    const p = document.createElement('p');
    children.forEach((child) => {
      if (child.tagName !== 'PICTURE') {
        p.appendChild(child);
      }
    });
    block.appendChild(p);
  } catch (error) {
    console.error(`Error loading query-index.json: ${error.message}`);
    throw error;
  }
}
