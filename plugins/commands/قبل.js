import axios from "axios";
import { join} from "path";
import { loadImage, createCanvas} from "canvas";
import fs from "fs-extra";

export const config = {
  name: "بوسه",
  version: "0.0.4-xaviabot-final",
  credits: "Clarence DK + تعديل مشمش",
  description: "يركب وجهين فوق صورة بوسة رومانسية",
  usage: "[tag]",
  cooldown: 5
};

// 🧠 دالة جلب صورة البروفايل من فيسبوك
async function getAvatarUrl(userID) {
  try {
    const res = await axios.post("https://www.facebook.com/api/graphql/", null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({ height: 400, scale: 1, userID, width: 400})
}
});
    return res.data.data.profile.profile_picture.uri;
} catch {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

export async function makeImage({ one, two}) {
  // ✅ تأكد من وجود مجلد الكاش
  await fs.ensureDir(global.cachePath);

  // تحميل صورة البوسة
  const templatePath = join(global.cachePath, "kiss_template.png");
  const templateURL = "https://i.postimg.cc/3xXSfwLC/b67185ef51e95c164937feb591a23f4c.jpg";
  await global.downloadFile(templatePath, templateURL);
  const template = await loadImage(templatePath);

  // تحميل صور البروفايل
  const avatarUrlOne = await getAvatarUrl(one);
  const avatarUrlTwo = await getAvatarUrl(two);

  const avatarPathOne = join(global.cachePath, `avt_${one}.png`);
  const avatarPathTwo = join(global.cachePath, `avt_${two}.png`);

  await global.downloadFile(avatarPathOne, avatarUrlOne);
  await global.downloadFile(avatarPathTwo, avatarUrlTwo);

  const avatarOne = await loadImage(avatarPathOne);
  const avatarTwo = await loadImage(avatarPathTwo);

  // إنشاء التصميم
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  const size = 100;

  // 🧑‍🤝‍🧑 الشخص الأول (اللي بيبوس)
  const x1 = 160, y1 = 60;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x1 + size / 2, y1 + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarOne, x1, y1, size, size);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x1 + size / 2, y1 + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // 💋 الشخص الثاني (اللي اتباس)
  const x2 = 380, y2 = 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x2 + size / 2, y2 + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarTwo, x2, y2, size, size);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x2 + size / 2, y2 + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // حفظ الصورة النهائية
  const pathImg = join(global.cachePath, `kiss_${one}_${two}.png`);
  const imageBuffer = canvas.toBuffer("image/png");

  fs.writeFileSync(pathImg, imageBuffer);

  // حذف الملفات المؤقتة
  fs.unlinkSync(avatarPathOne);
  fs.unlinkSync(avatarPathTwo);
  fs.unlinkSync(templatePath);

  return pathImg;
}

export async function onCall({ message}) {
  const { senderID, mentions} = message;
  const mention = Object.keys(mentions);
  if (!mention[0]) return message.reply("📌 منشن شخص عشان تبوسه يا زاحف 😅");

  const one = senderID;
  const two = mention[0];

  try {
    const path = await makeImage({ one, two});
    await message.reply({
      attachment: fs.createReadStream(path)
});
    fs.unlinkSync(path);
} catch (e) {
    console.error(e);
    message.reply("❌ حصل خطأ أثناء إنشاء أو إرسال الصورة.");
}
}
