const attunements = require("./AttunementRoles.json")

let spiresArray = [];

const utils = {
    spires = () => {
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
    }
}
module.exports = utils