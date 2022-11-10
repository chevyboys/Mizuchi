const getGoogleSheetAsJSON = require("./Utils.GetGoogleSheetsAsJson")
const snowflakes = require("../config/snowflakes.json");

const roleUtilities = {
  getColorsProvidedByRole: async (roleid, sheetRoleArray) => {
    const roles = sheetRoleArray || await getGoogleSheetAsJSON(snowflakes.sheets.roles);
    let roleColorsProvided = [];
    let role = roles.find(r => r.id == roleid && r.colorInventory != "");
    if (!role) return null;
    if (role.roleToInheritFrom) {
      roleColorsProvided.push(...await roleUtilities.getColorsProvidedByRole(role.roleToInheritFrom))
    }

    if (role.colorInventory) {
      if (typeof role.colorInventory === 'string') {
        let colorInventory = role.colorInventory.split("\n").map(c => c.replace("\n", "").replace('"', ""));
        roleColorsProvided.push(colorInventory)
      }
      else roleColorsProvided.push(...role.colorInventory)
    }
    return roleColorsProvided;
  },
  getMemberColorInventory: async (member) => {
    const roles = await getGoogleSheetAsJSON(snowflakes.sheets.roles);
    let memberRoles = member.roles.cache.sort((a, b) => a.comparePositionTo(b)).filter(r => roles.filter(sheetRole => sheetRole.colorInventory).map(sr => sr.id).includes(r.id));
    let roleInventory = (await (await Promise.all(memberRoles.map((r) => roleUtilities.getColorsProvidedByRole(r.id, roles))))).flat();
    return [... new Set(roleInventory.flat(1))];
  },
  getSecondaryRolesProvidedByRole: async (roleid, sheetRoleArray) => {
    const roles = sheetRoleArray || await getGoogleSheetAsJSON(snowflakes.sheets.roles);
    let rolesProvided = [];
    let role = roles.find(r => r.id == roleid && r.generalInventory != "");
    if (!role) return null;
    if (role.roleToInheritFrom) {
      rolesProvided.push(... await roleUtilities.getColorsProvidedByRole(role.roleToInheritFrom))
    }
    if (role.generalInventory) {
      if (typeof role.generalInventory === 'string') {
        let generalInventory = role.generalInventory.split("\n").map(c => c.replace("\n", "").replace('"', ""));
        rolesProvided.push(generalInventory);
      }
      else rolesProvided.push(...role.generalInventory)
    }
    return rolesProvided;
  },
  getSecondaryInventory: async (member) => {
    const roles = await getGoogleSheetAsJSON(snowflakes.sheets.roles)
    let memberRoles = member.roles.cache.filter(r => roles.filter(sheetRole => sheetRole.generalInventory).map(sr => sr.id).includes(r.id));
    let roleInventory = (await (await Promise.all(memberRoles.map((r) => roleUtilities.getSecondaryRolesProvidedByRole(r.id, roles))))).flat();
    return [... new Set(roleInventory.flat(1))];
  }

}


module.exports = roleUtilities;