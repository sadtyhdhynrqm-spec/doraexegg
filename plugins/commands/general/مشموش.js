import fs from "fs";
import path from "path";

const OWNER_ID = "61553754531086";

const config = {
  name: "مشمش",
  version: "1.0.0",
  description: "عرض كل ردود لوسي",
  usage: "'الكل' أو سؤال موجود في الردود",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "TobySanchez",
};

const langData = {
  ar_SY: {
    allResponsesHeader: "📦 كل الردود المحفوظة:",
    noResponses: "ما في أي ردود محفوظة حالياً.",
    notOwner: "الأمر ده مخصص لصاحب البوت فقط.",
    missingInput: "أكتب حاجة علشان أرد 🐥",
    noResult: "ما لقيت رد للكلمة دي 😕",
  },
};

const dataPath = path.join(process.cwd(), "ninoData.json");

function loadData() {
  try {
    if (!fs.existsSync(dataPath)) return {};
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return {};
  }
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function onCall({ message, args, getLang }) {
  const input = args.join(" ").trim();
  const data = loadData();

  // لو ما في كتابة
  if (!input) return message.reply(getLang("missingInput"));

  // أمر الكل - فقط للمالك
  if (input === "الكل") {
    if (message.senderID !== OWNER_ID) {
      return message.reply(getLang("notOwner"));
    }

    const keys = Object.keys(data);
    if (keys.length === 0) return message.reply(getLang("noResponses"));

    let reply = getLang("allResponsesHeader") + "\n\n";
    for (const key of keys) {
      reply += `📌 ${key}:\n`;
      data[key].forEach((r, i) => {
        reply += `   ${i + 1}. ${r}\n`;
      });
      reply += "\n";
    }

    return message.reply(reply.length > 1999 ? reply.slice(0, 1999) : reply);
  }

  // الرد على سؤال عادي
  if (!data[input]) return message.reply(getLang("noResult"));
  return message.reply(getRandom(data[input]));
}

export default {
  config,
  langData,
  onCall,
};
