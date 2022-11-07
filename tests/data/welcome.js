const snowflakes = require('../../config/snowflakes.json');
const member = require('members.json');
const welcomeData = {
  parseSentences: {
    input: [
      "Hello[comma] [name] this is a test[intentionally blank] \n[@Moderator]\n[@CommunityGuide]\n[@Admin]\n[#roles]\n[#rules]\n[#general]\n[#faq]\n[#general]\n[#spoilerPolicy]",
      "",
      "normal string"
    ],
    expected: [
      `Hello, [honorific] ${member.displayName} this is a test \n<@&${snowflakes.roles.Moderator}>\n<@&${snowflakes.roles.CommunityGuide}>\n<@&${snowflakes.roles.Admin}>\n<#${snowflakes.channels.roles}>\n<#${snowflakes.channels.rules}>\n<#${snowflakes.channels.general}>\n<#${snowflakes.channels.faq}>\n<#${snowflakes.channels.general}>\n<#${snowflakes.channels.spoilerPolicy}>`,
      "",
      "normal string"
    ]
  },
  welcomeObject: {
    expected: ""
  }
}


module.exports = welcomeData;