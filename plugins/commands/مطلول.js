import axios from "axios";
import { join} from "path";
import { createCanvas, loadImage} from "canvas";
import fs from "fs-extra";

export const config = {
  name: "مطلوب",
  description: "إنشاء بوستر مطلوب لشخص",
  usage: "[@منشن أو رد] [نص اختياري]",
  cooldown: 3,
  permissions: [0, 1, 2],
  credits: "XaviaTeam + تعديل مشمش",
};

export const langData = {
  ar_SY: {
    error: "لقد حدث خطأ، رجاء أعد المحاولة لاحقا",
},
};

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

export async function onCall({ message, getLang}) {
  try {
    const { mentions, messageReply, senderID} = message;
    const targetID = Object.keys(mentions)[0] || messageReply?.senderID || senderID;

    const avatarUrl = await getAvatarUrl(targetID);
    const avatarPath = join(global.cachePath, `wanted_${targetID}.png`);
    await global.downloadFile(avatarPath, avatarUrl);

    const avatar = await loadImage(avatarPath);
    const templatePath = join(__dirname, "wanted-arabic.png"); // الصورة اللي أرفقتها
    const template = await loadImage(templatePath);

    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext("2d");

    // رسم الخلفية
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // إعدادات الصورة داخل المربع
    const boxX = 150;
    const boxY = 180;
    const boxSize = 300;

    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxSize, boxSize);
    ctx.clip();
    ctx.drawImage(avatar, boxX, boxY, boxSize, boxSize);
    ctx.restore();

    const outputPath = join(global.cachePath, `wanted_result_${targetID}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    fs.unlinkSync(avatarPath);

    return message.reply({
      attachment: fs.createReadStream(outputPath)
});

} catch (e) {
    console.error(e);
    return message.reply(getLang("error"));
}
}

export default {
  config,
  langData,
  onCall,
};
