const Augur = require("augurbot"),
  configFolder = './config/',
  Discord = require("discord.js"),
  Module = new Augur.Module(),
  u = require("../utils/Utils.Generic");
/**
 * @param {string[]} filenames
 * @returns {object} filepairs
 */
function matchFilesToExample(filenames) {
  let filePairs = [];
  for (const file of filenames) {
    if (!file.indexOf("-example") > -1) {
      if (filenames.includes(file.replace(".json", "") + "-example" + ".json")) {
        filePairs.push({ file: file, example: file.replace(".json", "") + "-example" + ".json" })
      }
      else throw new Error(`config file: ${file} doesn't have an example file!`)
    }
  }
  return filePairs;
}



Module.setInit(async () => {
  return;
  const fs = require('fs');

  fs.readdir(configFolder, async (err, files) => {
    if (typeof files != typeof []) files = [files];
    let filePairs = matchFilesToExample(files);
    filePairs.forEach()
  });
});
module.exports = Module;