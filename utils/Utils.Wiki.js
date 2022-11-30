module.exports = {
  /**
   * 
   * @param {string} pageName a pagename that exists on wydds.wiki
   * @returns 
   */
  pagedescription: async (pageName) => {
    // eslint-disable-next-line no-useless-escape
    const regex = /{{2}[^}]*}{2}|'{2,}|<ref\ name=[^>\/]*>[^<]*<\/ref.|\[\[(:*)Category:[^\]|]*\|*|\[{2,}|\]{2,}|<ref[^>]*>/gm
    const axios = require("axios").default;
    let description = (await axios.get("https://wydds.wiki/w/rest.php/v1/page/" + pageName)).data.source;
    return description.substr(0, description.indexOf("==")).replace(regex, "");
  }
}