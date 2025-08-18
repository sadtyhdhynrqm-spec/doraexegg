import axios from 'axios';
import { join} from 'path';

const config = {
  name: "بروفايل",
  aliases: ["avt", "profileImage"],
  description: "عرض صورة بروفايل المستخدم",
  usage: "<رد/منشن/بدون>",
  credits: "XaviaTeam"
};

const langData = {
  "ar_SY": {
    "profileImage.noData": "لا يوجد بيانات...",
    "profileImage.error": "حدث خطأ أثناء جلب الصورة"
}
};

// 🔄 دالة جلب صورة البروفايل من Facebook GraphQL
async function getAvatarUrl(userID) {
  try {
    const user = await axios.post(`https://www.facebook.com/api/graphql/`, null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({ height: 400, scale: 1, userID, width: 400})
}
});
    return user.data.data.profile.profile_picture.uri;
} catch (err) {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

async function onCall({ message, getLang}) {
  const { type, mentions, senderID, messageReply} = message;
  let targetIDs = [];

  try {
    if (type === "message_reply") {
      targetIDs.push(messageReply.senderID);
} else if (Object.keys(mentions).length>= 1) {
      targetIDs = Object.keys(mentions);
      if (targetIDs.length> 10) return message.reply(getLang("profileImage.noData"));
} else {
      targetIDs.push(senderID);
}

    let allPaths = [];

    for (const userID of targetIDs) {
      const avatarUrl = await getAvatarUrl(userID);
      const tempPath = join(global.cachePath, `_avt${userID}_${Date.now()}.png`);
      await global.downloadFile(tempPath, avatarUrl);
      allPaths.push(tempPath);

      if (allPaths.length>= 10) break;
}

    if (allPaths.length === 0) return message.reply(getLang("profileImage.noData"));

    await message.reply({
      attachment: allPaths.map(p => global.reader(p))
});

    for (const path of allPaths) {
      try {
        global.deleteFile(path);
} catch (e) {
        console.error(e);
}
}
} catch (e) {
    console.error(e);
    message.reply(getLang("profileImage.error"));
}
}

export default {
  config,
  langData,
  onCall
};
