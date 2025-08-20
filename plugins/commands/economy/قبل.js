import { join} from "path";
import { loadImage, createCanvas} from "canvas";

export const config = {
  name: "بوسه",
  version: "0.0.2-xaviabot-custom",
  credits: "Clarence DK + تعديل مشمش",
  description: "يركب وجهين فوق صورة بوسة رومانسية",
  usage: "[tag]",
  cooldown: 5
};

export async function makeImage({ one, two}) {
  const templatePath = join(__dirname, "kiss.png"); // الصورة في نفس مجلد الأمر
  const template = await loadImage(templatePath);

  const avatarPathOne = join(global.cachePath, `avt_${one}.png`);
  const avatarPathTwo = join(global.cachePath, `avt_${two}.png`);

  await global.downloadFile(avatarPathOne, global.getAvatarURL(one));
  await global.downloadFile(avatarPathTwo, global.getAvatarURL(two));

  const avatarOne = await loadImage(avatarPathOne);
  const avatarTwo = await loadImage(avatarPathTwo);

  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext("2d");

  // رسم الخلفية
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  // إعدادات الصور
  const size = 100;

  // صورة الشخص الأول (اللي بيبوس)
  const x1 = 160, y1 = 60;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x1 + size / 2, y1 + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarOne, x1, y1, size, size);
  ctx.restore();

  // بوردر أبيض
  ctx.beginPath();
  ctx.arc(x1 + size / 2, y1 + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // صورة الشخص الثاني (اللي اتباس)
  const x2 = 380, y2 = 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x2 + size / 2, y2 + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarTwo, x2, y2, size, size);
  ctx.restore();

  // بوردر أبيض
  ctx.beginPath();
  ctx.arc(x2 + size / 2, y2 + size / 2, size / 2 + 2, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  const pathImg = join(global.cachePath, `kiss_${one}_${two}.png`);
  const imageBuffer = canvas.toBuffer();

  global.deleteFile(avatarPathOne);
  global.deleteFile(avatarPathTwo);
  global.writeFile(pathImg, imageBuffer);

  return pathImg;
}

export async function onCall({ message}) {
  const { senderID, mentions} = message;
  const mention = Object.keys(mentions);
  if (!mention[0]) return message.reply("📌 منشن شخص عشان تبوسه يا زاحف 😅");
  else {
    const one = senderID, two = mention[0];
    return makeImage({ one, two})
.then(async path => {
        await message.reply({
          attachment: global.reader(path)
}).catch(e => {
          message.reply("❌ حصل خطأ أثناء إرسال الصورة.");
          console.error(e);
});

        global.deleteFile(path);
})
.catch(e => {
        message.reply("❌ حصل خطأ أثناء إنشاء الصورة.");
        console.error(e);
});
}
}
