const randomIntOfMax = max => Math.floor(Math.random() * Math.floor(max));
const extractRandomly = items => items.splice(randomIntOfMax(items.length), 1);

module.exports = {
  whosFirst: function(members) {
    const tempMembers = members.concat();
    const numOfMembers = members.length;
    let result = "";
    for (let i = 0; i < numOfMembers; i++) {
      const member = extractRandomly(tempMembers);
      result += `${i + 1}: ${member}\n`;
    }
    return result;
  },
  whosFacilitator: function(members) {
    const tempMembers = members.concat();
    const facilitator = extractRandomly(tempMembers);
    const timeKeeper = extractRandomly(tempMembers);
    const clerical = extractRandomly(tempMembers);
    return `ファシリテーター: ${facilitator}\nタイム・キーパー: ${timeKeeper}\n書記: ${clerical}`;
  }
};
