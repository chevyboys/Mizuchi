const attunements = require("./AttunementRoles.json")

let spiresArray = [];

class Attunement {
  name = "";
  roleId = "";
  tower = "";
  description = "";
  manaTypes = [];
  constructor({ name, roleId, tower, description, manaTypes, scoreCode }) {
    this.name = name;
    this.roleId = roleId;
    this.tower = tower;
    this.description = description;
    this.manaTypes = manaTypes;
    this.scoreCode = scoreCode;
  }

}

const utils = {
  Attunement: Attunement,
  /**
   * 
   * @returns {Array<string>}
   * @description Returns an array of all the spires
   */
  spires: () => {
    if (spiresArray.length > 0) return spiresArray;
    let localSpiresArray = [];
    for (const key in attunements) {
      if (attunements.hasOwnProperty.call(attunements, key)) {
        const element = attunements[key];
        localSpiresArray.push(element.tower);
      }
    }
    spiresArray = [...new Set(localSpiresArray)];
    return spiresArray;
  },
  attunements: () => {
    let attunementArray = [];
    for (const key in attunements) {
      if (attunements.hasOwnProperty.call(attunements, key)) {
        const element = attunements[key];
        let attunement = new Attunement({
          name: key,
          roleId: element.id,
          tower: element.tower,
          description: element.description,
          manaTypes: element.manaTypes,
          scoreCode: element.scoreCode
        });
        attunementArray.push(attunement);
      }
    }
    return attunementArray;
  }


}
module.exports = utils