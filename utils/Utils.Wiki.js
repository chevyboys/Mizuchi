const { embed } = require("./Utils.Generic");
const wikiBaseUrl = "https://wydds.wiki/";
const filesBaseURL = wikiBaseUrl + "w/images/9/9e/";
const wikiBasePage = wikiBaseUrl + "w/rest.php/v1/page/";
const axios = require("axios");

/**
 * @typedef {{ title: string }} WikiPageSummary
 * @typedef {{ source: string }} WikiPageResponse
 * @typedef {{ query?: { allpages?: WikiPageSummary[], search?: WikiPageSummary[] } }} WikiQueryResponse
 */


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
  plainText = plainText.replace(/\[\[File:[^\]]+]]/g, "");
  // preserve project names
  plainText = plainText.replace(/\[\[Project:([^\]|]+)(\|[^\]]+)?]]/g, "$1");
  // preserve category names
  plainText = plainText.replace(/\[\[:?Category:([^|\]]+)\|?\w*]]/g, "$1");
  //remove special links but preserve names properly
  plainText = plainText.replace(/\[\[special:([^\]|]+)(\|[^\]]+)?]]/g, "$1");
  // remove link formatting, but keep the link display text
  plainText = plainText.replace(/\[\[([^\]|]+)(\|[^\]]+)?]]/g, "$1");
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
  plainText = plainText.replace(/\{\{[^{}]+}}/g, "");
  // remove references
  plainText = plainText.replace(/<ref[^>]*>[^<]+<\/ref>/g, "");
  plainText = plainText.replace(/<ref[^>]*>/g, "")
  return plainText;
}


/**
 * Finds the first image in a wikitext string and returns the encoded image file name for use in a URL.
 * @param {string} wikitext The wikitext string to search.
 * @returns {string | null} The encoded image file name, or null if no image is found.
 */
function getFirstImageFileNameAsURL(wikitext) {
  const imagePattern = /\[\[File:([^\]|]+)(\|[^\]]+)?]]/;
  const match = wikitext.match(imagePattern);
  // check if the image exists and the image file has a valid image file extension
  const fileName = match?.[1];
  if (fileName) {
    return filesBaseURL + encodeURIComponent(fileName.replaceAll(" ", "_"));
  }
  return null;
}

/**
 * Gets the names of all pages in a MediaWiki wiki.
 * @param {string} baseUrl The base URL of the MediaWiki API, including the protocol and hostname.
 * @returns {Promise<string[]>} An array of page names.
 */
async function getAllPageNames(baseUrl) {
  const queryUrl = baseUrl + "w/api.php?action=query&format=json&formatversion=2&list=allpages&aplimit=max";
  /** @type {{ data: WikiQueryResponse }} */
  const response = await axios.get(queryUrl);
  const pages = response.data.query?.allpages ?? [];
  return pages.map((page) => page.title);
}

/**
 * Searches a MediaWiki wiki for a specific page and returns the title of the first result.
 * @param {string} baseUrl The base URL of the MediaWiki API, including the protocol and hostname.
 * @param {string} search The search query.
 * @returns {Promise<string[]>} Matching page titles, or an empty array if no results are found.
 */
async function searchMediaWiki(baseUrl, search) {
  if (!search) return [];
  const queryUrl = baseUrl + "w/api.php?action=query&format=json&formatversion=2&list=search&srlimit=20&srprop=title&srsearch=" + encodeURIComponent(search);
  /** @type {{ data: WikiQueryResponse }} */
  const queryResult = await axios.get(queryUrl);
  const searchResults = queryResult.data.query?.search ?? [];
  if (searchResults.length > 0) {
    return searchResults.slice(0, 20).map((wikiArticle) => wikiArticle.title);
  }
  return [];
}

/**
 * @param {string} pageName
 * @returns {Promise<string>}
 */
async function getWikiPageSource(pageName) {
  /** @type {{ data: WikiPageResponse }} */
  const response = await axios.get(wikiBasePage + pageName);
  return response.data.source;
}

/**
 * @param {string[]} sectionTexts
 * @returns {{ name: string, value: string, inline: boolean }[]}
 */
function buildEmbedFields(sectionTexts) {
  /** @type {{ name: string, value: string, inline: boolean }[]} */
  let fields = sectionTexts
    .filter((section) => section.length > 3)
    .map((section) => {
      const title = "__" + section.trim().substring(0, section.indexOf("\n")).replaceAll("=", "").trim() + ":__";
      let text = wikitextToPlainText(section.substring(section.indexOf("\n")).trim());
      if (text.indexOf("\n=== ") > -1) {
        text = addBlockquote(text).replaceAll("=== ", "**").replaceAll(" ===\n\n", ":**\n").replaceAll(" ===\n", ":**\n");
      }

      return {
        name: title.length > 250 ? title.substring(0, 250) + "..." : title,
        value: (text.length > 1000 ? text.substring(0, 1000) + "..." : text) + "\n\n",
        inline: getMaxLineLength(text) < 80
      };
    });

  fields = fields.filter((field) => field.value.length > 0 && field.name.length > 0 && field.name.indexOf("Notes") === -1);
  return fields.length > 24 ? fields.slice(0, 24) : fields;
}

getAllPageNames(wikiBaseUrl)
  .then(pageNames => {
    wikiFunctions.allPages = pageNames;
  })
  .catch(error => {
    console.error('Error:', error);
  });

const wikiFunctions = {

  /** @type {string[]} */
  allPages: [],
  /**
   * 
   * @param {string} pageName a pagename that exists on wydds.wiki
   * @returns {Promise<string>}
   */
  pageDescription: async (pageName) => {
    // eslint-disable-next-line no-useless-escape
    //const regex = /{{2}[^}]*}{2}|'{2,}|<ref\ name=[^>\/]*>[^<]*<\/ref.|\[\[(:*)Category:[^\]|]*\|*|\[{2,}|\]{2,}|<ref[^>]*>/gm

    const wikiPageText = await getWikiPageSource(pageName);
    const sectionBreakIndex = wikiPageText.indexOf("==");
    const summaryText = sectionBreakIndex > -1 ? wikiPageText.substring(0, sectionBreakIndex) : wikiPageText;
    return wikitextToPlainText(summaryText);
  },

  /**
   * @param {string} pageName
   * @param {boolean} [short=false]
   * @returns {Promise<import("discord.js").MessageEmbed>}
   */
  pageEmbed: async (pageName, short) => {
    pageName = pageName.replaceAll(" ", "_");
    //Pull the wikitext of the desired page
    let wikiPageText = await getWikiPageSource(pageName);
    //Follow first redirect if any
    if (wikiPageText.indexOf("#REDIRECT") > -1) {
      const newPageName = wikiPageText.substring(wikiPageText.indexOf("#REDIRECT")).replace("#REDIRECT", " ").trim().replaceAll(" ", "_").replace("[[", "").replace("]]", "");
      wikiPageText = await getWikiPageSource(newPageName);
    }
    const image = getFirstImageFileNameAsURL(wikiPageText);
    let wikiSections = wikiPageText.split("\n== ")
      .map((section) => section.replace(" ==\n\n", ""));
    const descriptionSource = wikiSections.shift() ?? "";
    let description = wikitextToPlainText(descriptionSource);
    if (description.length > 4090) description = description.substring(0, 4090) + "...";

    const embd = embed()
      .setTitle(pageName.replaceAll("_", " "))
      .setColor("#000252")
      .setURL(wikiBaseUrl + "info/" + pageName)
      .setDescription(description);
    if (wikiSections.length > 0 && !short) {
      const fields = buildEmbedFields(wikiSections);
      if (fields.length > 0) {
        embd.addFields(fields);
      }
    }
    if (image) embd.setImage(image);
    return embd;
  },
  /**
   * @param {string} searchTerm
   * @returns {Promise<string[]>}
   */
  search: async (searchTerm) => searchMediaWiki(wikiBaseUrl, searchTerm)

}



module.exports = wikiFunctions