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
    const customerDataCompanyIdFromPageBlock = block.querySelector('div div div:nth-child(2) p');
    console.error('CustomerDataCompanyId:', customerDataCompanyIdFromPageBlock);
    const customerDataCompanyName = customerDataCompanyIdFromPageBlock.innerHTML;
    console.error('CustomerDataList:', customerDataCompanyName);
    block.innerHTML = '';

    // const customerDataFromIndex = customerDataCompanyName.find((customerDataObj) => customerDataObj.customer_id.toLowerCase() === customerDataItem.toLowerCase().trim());
    const customerDataFormattedProperly = customerDataCompanyName.toLowerCase().trim();
    console.error('CustomerDataFromIndex:', customerDataFormattedProperly);
    const customerDataToDisplay = customerDataObjects.find((customerDataObj) => customerDataObj.customer_id.toLowerCase() === customerDataFormattedProperly);
    console.error('CustomerDataToDisplay:', customerDataToDisplay);
    if (customerDataFormattedProperly) {
      // if (customerDataCompanyName.length === 1 && customerDataHTMLOutputObject.image) {
      //   block.innerHTML += customerDataHTMLOutputObject.outerHTML;
      // }
      block.innerHTML += '<h2><p> Customer details pulled from index</p></h2>';
      block.innerHTML += `<a href="${customerDataToDisplay.path}">${customerDataToDisplay.path}</a>`;
      block.innerHTML += `<p>Alert: ${customerDataToDisplay.alert_message}</p>`;
      // if (customerDataCompanyName.indexOf(customerDataItem) < customerDataCompanyName.length - 1) {
      //   block.innerHTML += '; ';
      // }
    }

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
