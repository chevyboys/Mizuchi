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
    let parsedRow = {};
    let cellStartIndex = 0;
    let cellEndIndex = 0;
    let cellValue = "";
    for (let j = 0; j < columns.length; j++) {
      const column = columns[j].trim();

      // find the next cell start and end index
      let cellStartQuotationIndex = row.indexOf('"', cellEndIndex);
      if (cellStartQuotationIndex === -1) {
        // if there is no quoted cell, use the next comma as the cell end index
        cellEndIndex = row.indexOf(",", cellEndIndex);
        if (cellEndIndex === -1) {
          // if there are no more commas, the rest of the string is the cell value
          cellEndIndex = row.length;
        }
      } else {
        // if there is a quoted cell, find the end quotation mark
        cellEndIndex = row.indexOf('"', cellStartQuotationIndex + 1);
        if (cellEndIndex === -1) {
          // if there is no closing quotation mark, the rest of the string is the cell value
          cellEndIndex = row.length;
        } else {
          // if there is a closing quotation mark, skip the next comma
          cellEndIndex = row.indexOf(",", cellEndIndex + 1);
          if (cellEndIndex === -1) {
            // if there are no more commas, the rest of the string is the cell value
            cellEndIndex = row.length;
          }
        }
      }

      // extract the cell value
      cellValue = row.substring(cellStartIndex, cellEndIndex).trim();
      if (cellValue.startsWith('"') && cellValue.endsWith('"')) {
        // if the cell value is quoted, remove the quotation marks
        cellValue = cellValue.substring(1, cellValue.length - 1);
      }
      parsedRow[column] = cellValue;

      // update the start index for the next cell
      cellStartIndex = cellEndIndex + 1;
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