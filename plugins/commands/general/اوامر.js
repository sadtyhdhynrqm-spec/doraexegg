const config = {
  name: "اوامر",
  _name: {
    "ar_SY": "الاوامر"
},
  aliases: ["cmds", "مساعدة"],
  version: "1.0.3",
  description: "عرض جميع الأوامر أو تفاصيل أمر معين",
  usage: "[اسم الأمر] (اختياري)",
  credits: "XaviaTeam"
};

const langData = {
  "ar_SY": {
    "help.list": "{list}",
    "help.commandNotExists": "❌ الأمر {command} غير موجود.",
    "help.commandDetails": ` ◆ الاسم: {name}\n ◆ الأسماء المستعارة: {aliases}\n ◆  ◆الوصف: {description}\n ◆ الاستخدام: {usage}\n ◆ الصلاحيات: {permissions}\n ◆ الفئة: {category}\n ◆ وقت الانتظار: {cooldown} ثانية\n ◆ المطور: Rako San`,
    "0": "عضو",
    "1": "إدارة المجموعة",
    "2": "إدارة البوت",
    "ADMIN": "المطور",
    "GENERAL": "عضو",
    "TOOLS": "أدوات",
    "ECONOMY": "اقتصاد",
    "MEDIA": "وسائط",
    "GROUP": "مجموعة",
    "AI": "ذكاء"
}
};

function getCommandName(commandName) {
  if (global.plugins.commandsAliases.has(commandName)) return commandName;
  for (let [key, value] of global.plugins.commandsAliases) {
    if (value.includes(commandName)) return key;
}
  return null;
}

async function onCall({ message, args, getLang, userPermissions, prefix}) {
  const { commandsConfig} = global.plugins;
  const commandName = args[0]?.toLowerCase();
  const language = message?.thread?.data?.language || global.config.LANGUAGE || 'ar_SY';

  if (!commandName) {
    let commands = {};

    for (const [key, value] of commandsConfig.entries()) {
      if (value.isHidden) continue;
      if (value.isAbsolute &&!global.config?.ABSOLUTES.includes(message.senderID)) continue;
      if (!value.permissions?.some(p => userPermissions.includes(p))) continue;

      let category = value.category || "GENERAL";
      if (langData[language][category.toUpperCase()]) {
        category = langData[language][category.toUpperCase()];
}

      if (!commands[category]) commands[category] = [];
      const displayName = value._name?.[language] || key;
      commands[category].push(displayName);
}

    let list = "※═══════『قائمة الاوامر』═══════※\n\n";

    for (const [category, cmds] of Object.entries(commands)) {
      list += ` □  ❴ ${category} ❵  ❰  \n\n`;

      for (let i = 0; i < cmds.length; i += 4) {
        const row = cmds.slice(i, i + 4).map(cmd => ` ◎ ${cmd}`).join("  ");
        list += `${row}\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n`;
}

      list += "\n";
}

    const total = Object.values(commands).reduce((sum, arr) => sum + arr.length, 0);
    list += `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n`;
    list += `    ○ ❴ الاوامر ❵  ◄  ${total}\n`;
    list += `    ○ ❴ الاسم  ❵  ◄   مشمش \n`;
    list += `    ○ ❴ المطور ❵  ◄  ࢪاكـو سان\n`;
    list += `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n`;
    list += ` ■ ${prefix}اوامر + اسم الامر لرئية تفاصيل الامر \n`;

    message.reply(getLang("help.list", { list}));
} else {
    const command = commandsConfig.get(getCommandName(commandName));
    if (!command) return message.reply(getLang("help.commandNotExists", { command: commandName}));

    const isHidden =!!command.isHidden;
    const isUserValid =!command.isAbsolute || global.config?.ABSOLUTES.includes(message.senderID);
    const isPermissionValid = command.permissions?.some(p => userPermissions.includes(p));

    if (isHidden ||!isUserValid ||!isPermissionValid) {
      return message.reply(getLang("help.commandNotExists", { command: commandName}));
}

    let category = command.category || "GENERAL";
    if (langData[language][category.toUpperCase()]) {
      category = langData[language][category.toUpperCase()];
}

    message.reply(getLang("help.commandDetails", {
      name: command.name,
      aliases: command.aliases?.join(", ") || "لا يوجد",
      version: command.version || "1.0.0",
      description: command.description || "لا يوجد وصف",
      usage: `${prefix}${commandName} ${command.usage || ""}`,
      permissions: command.permissions.map(p => getLang(String(p))).join(", "),
      category,
      cooldown: command.cooldown || 3,
      credits: command.credits || "غير معروف"
}).replace(/^ +/gm, ''));
}
}

export default {
  config,
  langData,
  onCall
};
