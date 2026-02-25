const getGoogleSheetAsJSON = require("./Utils.GetGoogleSheetsAsJson")
const fs = require("fs");
const snowflakes = require("../config/snowflakes.json");

//Check to see if the data folder has the inventory folder
//if not, create it
const path = './data/inventory';
if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
}

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
    let memberRoles = member.roles.cache.filter(r => roles.filter(sheetRole => sheetRole.colorInventory).map(sr => sr.id).includes(r.id));
    let roleInventory = (await (await Promise.all(memberRoles.map((r) => roleUtilities.getColorsProvidedByRole(r.id, roles))))).flat();
    //check the role inventory folder to see if the user has any roles in their inventory that are not currently provided by their discord roles, and if so, add those to the roleInventory array as well. This will ensure that users have access to any roles they have purchased from the shop, even if those roles are not currently provided by any of their discord roles for whatever reason (e.g. a temporary role that has expired but hasn't been removed from their inventory yet).
    const inventoryFiles = fs.readdirSync(path).filter(fileName => fileName.endsWith('.json'));
    for (const fileName of inventoryFiles) {
      const roleId = fileName.replace('.json', '');
      let roleData = JSON.parse(fs.readFileSync(`${path}/${fileName}`));
      //remove any expired roles that are in the file so they don't need to be processed again in the future
      const currentDate = new Date();
      roleData = roleData.filter(entry => !entry.scheduledRemovalDate || new Date(entry.scheduledRemovalDate) > currentDate);
      //only write to the file again if there were any expired roles that needed to be removed, to avoid unnecessary writes to the file system
      if (roleData.length !== JSON.parse(fs.readFileSync(`${path}/${fileName}`)).length) {
        fs.writeFileSync(`${path}/${fileName}`, JSON.stringify(roleData));
      }
      if (roleData.find(entry => entry.userId === member.id)) {
        //the user has this role in their inventory, so we should add it to the roleInventory array if it's not already provided by their discord roles
        if (!roleInventory.includes(roleId)) {
          roleInventory.push(roleId);
        }
      }
    }

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
  },
  addRoleToInventory: async (member, roleId, scheduledRemovalDate = null) => {
    const roleFilePath = `./roleInventory/${roleId}.json`;
    if (!fs.existsSync(roleFilePath)) {
      fs.writeFileSync(roleFilePath, JSON.stringify([]));
    }
    let roleData = JSON.parse(fs.readFileSync(roleFilePath));
    roleData.push({
      userId: member.id,
      dateAdded: new Date(),
      scheduledRemovalDate: scheduledRemovalDate
    });
    fs.writeFileSync(roleFilePath, JSON.stringify(roleData));
  }
}


module.exports = roleUtilities;