const { embed } = require("./Utils.Generic");
const wikiBaseUrl = "https://wydds.wiki/";
const filesBaseURL = wikiBaseUrl + "/w/images/9/9e/";
const wikiBasePage = wikiBaseUrl + "w/rest.php/v1/page/";
const axios = require("axios").default;

/**
 * Determines the maximum line length of a string.
 * @param {string} text The text to process.
 * @returns {number} The maximum line length.
 */
function getMaxLineLength(text) {
  let lines = text.split("\n");
  let maxLength = 0;
  for (let line of lines) {
    maxLength = Math.max(maxLength, line.length);
  }
  return maxLength;
}

/**
 * Adds "> " to the beginning of each line not containing "===" after the first instance of "===".
 * @param {string} text The text to process.
 * @returns {string} The processed text.
 */
function addBlockquote(text) {
  let lines = text.split("\n");
  let inBlockquote = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith("===") && !inBlockquote) {
      // start of blockquote
      inBlockquote = true;
    } else if (inBlockquote && !line.startsWith(">") && !line.startsWith("=== ") && line.length > 1) {
      // add blockquote prefix to line
      lines[i] = "> " + line;
    }
  }
  return lines.join("\n");
}

/**
 * Converts a wikitext string into a plain text string by removing wikitext formatting and links.
 * @param {string} wikitext The wikitext string to convert.
 * @returns {string} The plain text string.
 */
function wikitextToPlainText(wikitext) {
  let plainText = wikitext;
  // remove images
  plainText = plainText.replace(/\[\[File:[^\]]+\]\]/g, "");
  // preserve project names
  plainText = plainText.replace(/\[\[Project:([^\]|]+)(\|[^\]]+)?\]\]/g, "$");
  // preserve category names
  plainText = plainText.replace(/\[\[:?Category:([^|\]]+)\|?\w*\]\]/g, "$1");
  //remove special links but preserve names properly
  plainText = plainText.replace(/\[\[special:([^\]|]+)(\|[^\]]+)?\]\]/g, "$1");
  // remove link formatting, but keep the link display text
  plainText = plainText.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, "$1");
  //handle bullet points
  plainText = plainText.replaceAll("\n* ", "\n• ");
  //handle sub link
  plainText = plainText.replaceAll("\n;", "\n• ");
  // replace bold formatting with double asterisks
  plainText = plainText.replace(/'''|''/g, "**");
  // remove other formatting
  plainText = plainText.replace(/{{[^{}]+}}/g, "");
  // remove comments
  plainText = plainText.replace(/<!--[^-]+-->/g, "");
  // remove tables
  plainText = plainText.replace(/{\|[^}]+\|}/g, "");
  // remove templates
  plainText = plainText.replace(/\{\{[^{}]+\}\}/g, "");
  // remove references
  plainText = plainText.replace(/<ref[^>]*>[^<]+<\/ref>/g, "");
  plainText = plainText.replace(/<ref[^>]*>/g, "")
  return plainText;
}


/**
 * Finds the first image in a wikitext string and returns the encoded image file name for use in a URL.
 * @param {string} wikitext The wikitext string to search.
 * @returns {string} The encoded image file name, or an empty string if no image or invalid image file extension is found.
 */
function getFirstImageFileNameAsURL(wikitext) {
  const imagePattern = /\[\[File:([^\]|]+)(\|[^\]]+)?\]\]/;
  let match = wikitext.match(imagePattern);
  // check if the image exists and the image file has a valid image file extension
  if (match && match.length > 1) {
    return filesBaseURL + encodeURIComponent(match[1].replaceAll(" ", "_"));
  }
  return false;
}

/**
 * Gets the names of all pages in a MediaWiki wiki.
 * @param {string} baseUrl The base URL of the MediaWiki API, including the protocol and hostname.
 * @returns {string[]} An array of page names.
 */
async function getAllPageNames(baseUrl) {
  let queryUrl = baseUrl + "/w/api.php?action=query&format=json&formatversion=2&list=allpages&aplimit=max";
  let queryResult = await axios.get(queryUrl);
  let pages = queryResult.data.query.allpages;
  let pageNames = [];
  for (let i = 0; i < pages.length; i++) {
    pageNames.push(pages[i].title);
  }
  return pageNames;
}

/**
 * Searches a MediaWiki wiki for a specific page and returns the title of the first result.
 * @param {string} baseUrl The base URL of the MediaWiki API, including the protocol and hostname.
 * @param {string} search The search query.
 * @returns {string} The title of the first search result, or an empty string if no results are found.
 */
async function searchMediaWiki(baseUrl, search) {
  let queryUrl = baseUrl + "/w/api.php?action=query&format=json&formatversion=2&list=search&srlimit=1&srprop=title&srsearch=" + encodeURIComponent(search);
  let queryResult = await axios.get(queryUrl);
  let searchResults = queryResult.data.query.search;
  if (searchResults.length > 0) {
    return searchResults[0].title;
  }
  return "";
}

const constAllPages = getAllPageNames(wikiBaseUrl);

const wikiFunctions = {

  allPages: constAllPages,
  /**
   * 
   * @param {string} pageName a pagename that exists on wydds.wiki
   * @returns 
   */
  pageDescription: async (pageName) => {
    // eslint-disable-next-line no-useless-escape
    //const regex = /{{2}[^}]*}{2}|'{2,}|<ref\ name=[^>\/]*>[^<]*<\/ref.|\[\[(:*)Category:[^\]|]*\|*|\[{2,}|\]{2,}|<ref[^>]*>/gm

    let wikiPageText = (await axios.get(wikiBasePage + pageName)).data.source;
    return wikitextToPlainText(wikiPageText.substr(0, wikiPageText.indexOf("==")));
  },

  pageEmbed: async (pageName) => {
    pageName = pageName.replaceAll(" ", "_");
    let wikiPageText = (await axios.get(wikiBasePage + pageName)).data.source;
    let image = getFirstImageFileNameAsURL(wikiPageText);
    let wikiSections = wikiPageText.split("\n== ")
    if (Array.isArray(wikiSections)) wikiSections.every((v) => v.replace(" ==\n\n", ""))
    let description = wikitextToPlainText(Array.isArray(wikiSections) ? wikiSections.shift() : wikiSections);
    if (description.length > 4090) description = description.substr(0, 4090) + "...";

    let embd = embed()
      .setTitle(pageName.replaceAll("_", " "))
      .setColor("#000252")
      .setURL(wikiBaseUrl + "info/" + pageName)
      .setDescription(description)
    if (wikiSections.length > 0 && Array.isArray(wikiSections)) {
      let fields = wikiSections.filter(s => s.length > 3).map(s => {
        let title = "__" + s.trim().substr(0, s.indexOf("\n")).replaceAll("=", "").trim() + ":__";
        let text = wikitextToPlainText(s.substr(s.indexOf("\n")).trim());
        if (text.indexOf("\n=== ")) {
          text = addBlockquote(text).replaceAll("=== ", "**").replaceAll(" ===\n\n", ":**\n").replaceAll(" ===\n", ":**\n")
        }
        return {
          name: title.length > 250 ? text.substr(0, 250) + "..." : title,
          value: (text.length > 1000 ? text.substr(0, 1000) + "..." : text) + "\n\n",
          inline: getMaxLineLength(text) < 80
        }
      });
      fields = fields.filter(f => f.value.length > 0 && f.name.length > 0 && f.name.indexOf("Notes") == -1);
      if (fields.length > 24) fields = fields.slice(0, 24);
      embd.addFields(fields)
    }
    if (image) embd.setImage(image)
    return embd;
  },
  search: async (searchTerm) => searchMediaWiki(wikiBaseUrl, searchTerm)

}



module.exports = wikiFunctions