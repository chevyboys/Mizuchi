const axios = require("axios").default

/**
 * converts a csv into an array of objects
 * @param {string} rawResult 
 * @returns {[object]} an array of objects containing a member variable for each column in the csv, the value of which coresponds to the cell that matches the row and column of the data
 */
function convertCSVToJSON(rawResult) {
  let rawRows = rawResult.split('\r\n');
  let columns = rawRows.shift().split(",");
  let data = [];
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const cells = row.split(",");
    let parsedRow = {};
    for (let j = 0; j < columns.length; j++) {
      const column = columns[j];
      const cell = cells[j];
      parsedRow[column] = cell;
    }
    data.push(parsedRow);
  }
  return data;
}
/**
 * 
 * @param {string} url the url of the google sheet csv publication. To get this, go to file -> share -> publish to web and select the page you want to export, and the CSV format
 * @returns {[object]} an array of objects for each filled in row, with member variables for each column
 */
async function get(url) {
  let rawResult = (await axios.get(url)).data;
  return convertCSVToJSON(rawResult);
}


module.exports = get;