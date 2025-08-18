import axios from 'axios';
import { join} from "path";
import fs from 'fs';

if (!fs.existsSync(global.cachePath)) {
    fs.mkdirSync(global.cachePath);
}

export const config = {
    name: "زوجني",
    version: "0.0.1-xaviabot-port",
    description: "زواج عشوائي بينك وبين أحد أعضاء المجموعة",
    cooldown: 15
};

// 🔄 دالة جلب صورة البروفايل من Facebook GraphQL
async function getAvatarUrl(userID) {
    if (isNaN(userID)) throw new Error(`❌ userID غير صالح: ${userID}`);
    try {
        const user = await axios.post(`https://www.facebook.com/api/graphql/`, null, {
            params: {
                doc_id: "5341536295888250",
                variables: JSON.stringify({ height: 500, scale: 1, userID, width: 500})
}
});
        return user.data.data.profile.profile_picture.uri;
} catch {
        return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

const lovePath = join(global.assetsPath, "love_pairing.png");

export async function onLoad() {
    await global.downloadFile(
        lovePath,
        "https://i.ibb.co/2g0wdVV/heart-icon-14.png"
).catch(console.error);
}

export async function onCall({ message}) {
    try {
        const { participantIDs, senderID} = message;
        const botID = api.getCurrentUserID();
        const listUserID = participantIDs.filter(ID => ID!== botID && ID!== senderID);

        if (listUserID.length === 0) return message.reply("ما في حد تتزوجه يا زاحف 😅");

        const matchID = listUserID[Math.floor(Math.random() * listUserID.length)];
        const matchRate = Math.floor(Math.random() * 101);

        const senderName = await global.controllers.Users.getName(senderID);
        const matchName = await global.controllers.Users.getName(matchID);

        const mentions = [
            { id: senderID, tag: senderName},
            { id: matchID, tag: matchName}
        ];

        const senderAvatarUrl = await getAvatarUrl(senderID);
        const matchAvatarUrl = await getAvatarUrl(matchID);

        const senderAvatarPath = join(global.cachePath, `marry_${senderID}_${Date.now()}.png`);
        const matchAvatarPath = join(global.cachePath, `marry_${matchID}_${Date.now()}.png`);

        await global.downloadFile(senderAvatarPath, senderAvatarUrl);
        await global.downloadFile(matchAvatarPath, matchAvatarUrl);

        const attachments = [
            global.reader(senderAvatarPath),
            global.reader(lovePath),
            global.reader(matchAvatarPath)
        ];

        const messageBody = `💍 تم عقد قران الزاحفين (๑°3°๑)!\nنتمنى لكم حياة سعيدة مليئة بالحب والهموم ヽ(*´з｀*)ﾉ\n\n❤️ نسبة التوافق: ${matchRate}%\n👫 ${senderName} + ${matchName}`;

        await message.reply({
            body: messageBody,
            mentions,
            attachment: attachments
});

        global.deleteFile(senderAvatarPath);
        global.deleteFile(matchAvatarPath);
} catch (error) {
        console.error(error);
        message.reply("حدث خطأ أثناء تنفيذ الزواج 💔");
}
}
