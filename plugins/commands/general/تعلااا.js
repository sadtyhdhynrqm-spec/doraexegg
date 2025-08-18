import fs from "fs";
import path from "path";

const config = {
  name: "تعلم",
  aliases: ["تعلم"],
  description: "علم لوسي كيفية الكلام",
  usage: "[سؤال] => [رد]",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "TobySanchez",
};

const langData = {
  ar_SY: {
    wrongSyntax: "الصيغة غلط. استعمل: السؤال => الرد",
    missingInput: "السؤال أو الرد ناقص!",
    succeed: "تم إضافة الرد ✅",
    failed: "فشل الإضافة ❌",
    error: "في مشكلة، حاول تاني", 
  },
};

const dataPath = path.join(process.cwd(), "ninoData.json");

function loadData() {
  try {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

async function onCall({ message, args, getLang }) {
  const arrowIndex = args.indexOf("=>");
  if (arrowIndex === -1) return message.reply(getLang("wrongSyntax"));

  const key = args.slice(0, arrowIndex).join(" ").trim();
  const value = args.slice(arrowIndex + 1).join(" ").trim();

  if (!key || !value) return message.reply(getLang("missingInput"));

  try {
    const data = loadData();
    if (!data[key]) data[key] = [];
    if (!data[key].includes(value)) data[key].push(value);
    const saved = saveData(data);
    if (saved) return message.reply(getLang("succeed"));
    else return message.reply(getLang("failed"));
  } catch (err) {
    return message.reply(getLang("error"));
  }
}

export default {
  config,
  langData,
  onCall,
};
