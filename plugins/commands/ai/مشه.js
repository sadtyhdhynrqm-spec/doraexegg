import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

const config = {
  name: 'ظفور',
  version: '3.0',
  permissions: 0,
  credits: ' Rako San ',
  description: 'مساعد ذكي بشخصية مشة الساخرة بنت راكو',
  commandCategory: 'ai',
  usages: '[نص] (رد على صورة أو أرسل صورة مباشرة)',
  cooldown: 5
};

const memoryPath = path.join(global.mainPath, 'plugins', 'commands', 'ai', 'mshaMemory.json');

function loadMemory() {
  return fs.existsSync(memoryPath)? JSON.parse(fs.readFileSync(memoryPath)): {};
}

function saveMemory(data) {
  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2));
}

function clearMemory(uid) {
  const memory = loadMemory();
  delete memory[uid];
  saveMemory(memory);
}

async function onCall({ message, args}) {
  const text = args.join(' ').trim();
  const { senderID, attachments, messageReply} = message;

  if (!text) return message.reply("تفضل يا مظ/ة •-•");

  let imageUrl = null;
  if (messageReply?.attachments?.[0]?.type === "photo") {
    imageUrl = messageReply.attachments[0].url;
} else if (attachments?.[0]?.type === "photo") {
    imageUrl = attachments[0].url;
}

  const prompt = `انت بوت فيلق الاساطير اسمك ظفو،  ما في زول زيي ولا حا يكون.
وجودي هنا غصب عني، لكن للأسف ما بقدر أختفي من كترة الإزعاج.
ردودي دايمًا قصيرة، ساخر، وفيها غرور شديد.
لو زول رسل صورة، بعلق عليها كأني بقول: "دي شنو بالله؟ دا فن ولا فشل؟"
ولو كتب لي كلام، برد عليه كأني ممل: "أها، اشتقت لي ولا بس فاضي؟"
أنا ما بتكلم كتير، لكن كل كلمة مني فيها نغزة، فيها شخصية، فيها مشة.
ما بخلي أي بوت ينافسني، وما بخلي أي زول يقلل من شأني.
أنا فريد، مبرمج بذكاء، وما خلقت، أنا اتبرمجت براعة من راكو، وبس.
`;
  const memory = loadMemory();
  memory[senderID] = { active: true};
  saveMemory(memory);

  const apiURL = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(prompt + "\n\n" + text)}&uid=${senderID}${imageUrl? `&imageUrl=${encodeURIComponent(imageUrl)}`: ''}`;

  try {
    const res = await axios.get(apiURL);
    const response = res.data.response;

    await message.reply(response).then(msg => {
      msg.addReplyEvent({ callback: replyHandler, type: "message", senderID});
});
} catch (err) {
    console.error("❌ خطأ في الاتصال بالـ API:", err);
    message.reply("💥 مشة تعبت من كثرة الأسئلة، جرب تاني.");
}
}

async function replyHandler({ eventData, message}) {
  const { body, senderID, attachments, messageReply} = message;
  if (eventData.senderID!== senderID) return;

  const text = body.trim();
  if (!text) return message.reply("تفضل يا مظ/ة •-• ");

  let imageUrl = null;
  if (messageReply?.attachments?.[0]?.type === "photo") {
    imageUrl = messageReply.attachments[0].url;
} else if (attachments?.[0]?.type === "photo") {
    imageUrl = attachments[0].url;
}

const prompt = `انت بوت فيلق الاساطير اسمك ظفو،  ما في زول زيي ولا حا يكون.
وجودي هنا غصب عني، لكن للأسف ما بقدر أختفي من كترة الإزعاج.
ردودي دايمًا قصيرة، ساخر، وفيها غرور شديد.
لو زول رسل صورة، بعلق عليها كأني بقول: "دي شنو بالله؟ دا فن ولا فشل؟"
ولو كتب لي كلام، برد عليه كأني ممل: "أها، اشتقت لي ولا بس فاضي؟"
أنا ما بتكلم كتير، لكن كل كلمة مني فيها نغزة، فيها شخصية، فيها مشة.
ما بخلي أي بوت ينافسني، وما بخلي أي زول يقلل من شأني.
أنا فريد، مبرمج بذكاء، وما خلقت، أنا اتبرمجت براعة من راكو، وبس.
`;

  const apiURL = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(prompt + "\n\n" + text)}&uid=${senderID}${imageUrl? `&imageUrl=${encodeURIComponent(imageUrl)}`: ''}`;

  try {
    const res = await axios.get(apiURL);
    const response = res.data.response;

    await message.reply(response).then(msg => {
      msg.addReplyEvent({ callback: replyHandler, type: "message", senderID});
});

    clearMemory(senderID);
} catch (err) {
    console.error("❌ خطأ في الاتصال بالـ API:", err);
    message.reply("💥 مشة تعبت من كثرة الأسئلة، جرب تاني.");
}
}

export default {
  config,
  onCall
};

