import axios from 'axios';

const config = {
  name: 'مشمش',
  version: '2.0',
  permissions: 0,
  credits: 'rapido',
  description: 'مساعد ذكي يدعم الصور والنصوص',
  commandCategory: 'ai',
  usages: '[نص] (رد على صورة أو أرسل صورة مباشرة)',
  cooldown: 5
};

async function onCall({ message, args}) {
  const text = args.join(' ').trim();
  const { senderID, attachments, messageReply} = message;

  if (!text) return message.reply("👀 اها يا زول، عايز تقول شنو؟");

  // استخراج رابط الصورة من الرد أو المرفقات
  let imageUrl = null;

  if (messageReply?.attachments?.[0]?.type === "photo") {
    imageUrl = messageReply.attachments[0].url;
} else if (attachments?.[0]?.type === "photo") {
    imageUrl = attachments[0].url;
}

  const apiURL = `https://rapido.zetsu.xyz/api/gemini?chat=${encodeURIComponent(text)}&uid=${senderID}${imageUrl? `&imageUrl=${encodeURIComponent(imageUrl)}`: ''}`;

  try {
    const res = await axios.get(apiURL);
    const response = res.data.response;

    message.reply(response);
} catch (err) {
    console.error("❌ خطأ في الاتصال بالـ API:", err);
    message.reply("💥 حصلت مشكلة يا زول، جرب تاني.");
}
}

export default { config, onCall};
