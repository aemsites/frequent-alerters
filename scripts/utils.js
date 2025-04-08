const INDEX = '/query-index.json';
const EVENTS_INDEX = '/customer-data/query-index.json';

// /**
//  * Load the query-index.json file and parse its content.
//  * @param {string} filePath - Path to the query-index.json file.
//  * @returns {Object} Parsed JSON data from the file.
//  */
// function loadQueryIndex(filePath) {
//   try {
//     const absolutePath = EVENTS_INDEX.resolve(filePath);
//     const data = fs.readFileSync(absolutePath, 'utf-8');
//     return JSON.parse(data);
//   } catch (error) {
//     console.error(`Error loading query-index.json: ${error.message}`);
//     throw error;
//   }
// }

/**
 * Retrieves data from an index.
 * @param {string} [index=INDEX] - The index to retrieve data from.
 * @returns {Promise<Array>} - A promise that resolves to an array of retrieved data.
 */
async function getIndexData(index = INDEX) {
  console.error(`Fetching data from index: ${index}`);
  const retrievedData = [];
  const limit = 500;

  // Helper function to append query parameters correctly
  const appendQuery = (url, param) => (url.includes('?') ? `${url}&${param}` : `${url}?${param}`);

  const first = await fetch(appendQuery(index, `limit=${limit}`))
    .then((resp) => {
      if (resp.ok) {
        return resp.json();
      }
      return {};
    });

  const { total } = first;
  if (total) {
    retrievedData.push(...first.data);
    const promises = [];
    const buckets = Math.ceil(total / limit);
    for (let i = 1; i < buckets; i += 1) {
      promises.push(new Promise((resolve) => {
        const offset = i * limit;
        fetch(appendQuery(index, `offset=${offset}&limit=${limit}`))
          .then((resp) => {
            if (resp.ok) {
              return resp.json();
            }
            return {};
          })
          .then((json) => {
            const { data } = json;
            if (data) {
              resolve(data);
            }
            resolve([]);
          });
      }));
    }

    await Promise.all(promises).then((values) => {
      values.forEach((list) => {
        retrievedData.push(...list);
      });
    });
  }
  return retrievedData;
}

const customerData = [];
/**
 * Retrieves the customer data from the index.
 * @returns {Promise<Array>} A promise that resolves to an array of customer data.
 */
export async function getCustomerData() {
  if (!customerData.length) {
    console.error(`Fetching data from index: ${EVENTS_INDEX}`);
    customerData.push(...await getIndexData(EVENTS_INDEX));
  }
  // Protected against callers modifying the objects
  return structuredClone(customerData);
}

let indexData = null;
/**
 * Retrieves index data from the query-index file.
 * @returns {Promise<Array>} A promise that resolves to an array of index data.
 */
export const getGenericIndexData = (() => async () => {
  if (!indexData) {
    indexData = await getIndexData();
  }
  // Protected against callers modifying the objects
  return structuredClone(indexData);
})();

// /**
//  * Get index data for a specific node and its children.
//  * @param {Object} indexData - Parsed JSON data from query-index.json.
//  * @param {string} nodeName - Name of the node to retrieve data for.
//  * @returns {Object} Node data and its children, if available.
//  */
// export async function getIndexData(indexData, nodeName) {
//   if (!indexData || typeof indexData !== 'object') {
//     throw new Error('Invalid index data provided.');
//   }

//   const node = indexData[nodeName];
//   if (!node) {
//     throw new Error(`Node "${nodeName}" not found in index data.`);
//   }

//   const children = Object.keys(indexData)
//     .filter((key) => indexData[key].parent === nodeName)
//     .reduce((acc, key) => {
//       acc[key] = indexData[key];
//       return acc;
//     }, {});

//   return { node, children };
// }

// Example usage
// try {
//   const queryIndexPath = './query-index.json'; // Adjust the path as needed
//   const indexData = loadQueryIndex(queryIndexPath);

//   const nodeName = 'exampleNode'; // Replace with the desired node name
//   const { node, children } = getIndexData(indexData, nodeName);

//   console.log('Node Data:', node);
//   console.log('Child Nodes:', children);
// } catch (error) {
//   console.error(error.message);
// }
