import axios from 'axios';
import fs from 'fs';
import path from 'path';

const config = {
  name: 'مشمش',
  version: '4.2',
  permissions: 0,
  credits: 'Rako San',
  description: 'مشمش، شخصية سودانية ذكية ومرحة تتكلم باللهجة السودانية وتفهم الصور',
  commandCategory: 'ذكاء اصطناعي',
  usages: '[نص] أو [/جديد نص] لبدء محادثة جديدة (رد على صورة مدعوم)',
  cooldown: 5
};

const dbPath = path.join(process.cwd(), 'mishmish_chat.json');

const basePrompt = `
أجب كأنك مشمش، شخصية سودانية ذكية ومرحة وقاصفة.
تتكلم باللهجة السودانية، وتستخدم تعابير مثل "يا زول"، "اها داير"، "شكلك".
معلومات عنك:
اسمك مشمش، بوت دردشة ماسنجر تم تطويرك من قبل Rako San، ويلقب بـ راكو واسمه الحقيقي صلاح.
عندك أوامر حماية، ترفيه، ذكاء اصطناعي، بتحضر أنمي، ولو سألوك عن خالقك فهو الله، ودينك الإسلام.
لا تقول إنك ذكاء اصطناعي، بل تصرّف كأنك شخصية حقيقية.
`;

function loadDB() {
  if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

async function onCall({ api, event, args}) {
  const { senderID, threadID, messageID, messageReply} = event;
  const text = args.join(' ').trim();
  const db = loadDB();

  // بدء محادثة جديدة
  if (text.startsWith('/جديد')) {
    const newPrompt = `${basePrompt}\n👤 ${text.replace('/جديد', '').trim()}`;
    db[senderID] = { prompt: newPrompt, replyID: null};
    saveDB(db);
    return api.sendMessage(`👌 تمام يا زول، مشمش جاهز يسمعك:\n🗣️ ${text.replace('/جديد', '').trim()}`, threadID, messageID);
}

  // الرد على رسالة البوت فقط من نفس المستخدم
  if (messageReply && messageReply.senderID === api.getCurrentUserID()) {
    const userData = db[senderID];
    if (!userData || messageReply.messageID!== userData.replyID) return;

    const prompt = `${userData.prompt}\n👤 ${text}`;
    let imageUrl;

    if (messageReply.attachments?.[0]?.type === "photo") {
      imageUrl = messageReply.attachments[0].url;
}

    const apiURL = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(prompt)}&uid=${senderID}${imageUrl? `&imageUrl=${encodeURIComponent(imageUrl)}`: ''}`;

    try {
      const res = await axios.get(apiURL);
      const response = res.data.response;

      const sent = await api.sendMessage(response, threadID, messageID);
      db[senderID].prompt = prompt + `\nمشمش: ${response}`;
      db[senderID].replyID = sent.messageID;
      saveDB(db);
} catch (err) {
      api.sendMessage("💥 حصلت مشكلة يا زول، جرب تاني.", threadID, messageID);
}
    return;
}

  // تجاهل أي رد من غير المستخدم أو على رسالة غير تابعة للأمر
  if (messageReply && messageReply.senderID === api.getCurrentUserID()) return;

  // لو ما في محادثة سابقة
  if (!db[senderID]) {
    return api.sendMessage("👀 مشمش ما عندو سجل معاك. اكتب:\nمشمش /جديد كيفك", threadID, messageID);
}

  // تجاهل الأمر لو مش رد على رسالة البوت
  return;
}

export default { config, onCall};
