const axios = require("axios").default

/**
 * converts a csv into an array of objects
 * @param {string} rawResult 
 * @param {boolean} horizontal whether the csv is formatted horizontally (first column is key, subsequent columns are different objects) or vertically (first row is headers, subsequent rows are different objects)
 * @returns {[object]} an array of objects containing a member variable for each column in the csv, the value of which coresponds to the cell that matches the row and column of the data
 */
function convertCSVToJSON(rawResult, horizontal = false) {
  if (horizontal) {
    // horizontal parsing, where the first column is the key, and each subsequent column is a different object within the array
    let lines = rawResult.split("\n").map(line => line.split(","));
    let result = {};
    //parse each row into it's own array in the result object with the first column as the key
    for (let i = 1; i < lines.length; i++) {
      let row = lines[i];
      let key = row[0];
      result[key] = [];
      for (let j = 1; j < row.length; j++) {
        if (row[j] === "" || row[j] == "\r" || row[j] === undefined || row[j] === null) continue;
        result[key].push(row[j]);
      }
    }
    return result;
  }
  else {
    let rawRows = rawResult.split('\r\n');
    let columns = rawRows.shift().split(",");
    let data = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const cells = row.split(",");
      let parsedRow = {};
      for (let j = 0; j < columns.length; j++) {
        const column = columns[j].trim();
        const cell = cells[j].trim();
        parsedRow[column] = cell;
      }
      data.push(parsedRow);
    }
    return data;
  }
}
/**
 * 
 * @param {string} url the url of the google sheet csv publication. To get this, go to file -> share -> publish to web and select the page you want to export, and the CSV format
 * @returns {[object]} an array of objects for each filled in row, with member variables for each column
 */
async function get(url, horizontal) {
  let rawResult = (await axios.get(url)).data;
  return convertCSVToJSON(rawResult, horizontal);
}


module.exports = get;