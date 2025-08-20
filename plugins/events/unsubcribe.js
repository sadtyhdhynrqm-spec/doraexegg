import { createCanvas, loadImage} from "canvas";
import axios from "axios";
import fs from "fs-extra";
import path from "path";

const backgrounds = [
  "https://i.imgur.com/dDSh0wc.jpeg",
  "https://i.imgur.com/UucSRWJ.jpeg",
  "https://i.imgur.com/OYzHKNE.jpeg",
  "https://i.imgur.com/V5L9dPi.jpeg",
  "https://i.imgur.com/M7HEAMA.jpeg"
];

async function getAvatarUrl(userID) {
  try {
    const res = await axios.post("https://www.facebook.com/api/graphql/", null, {
      params: {
        doc_id: "5341536295888250",
        variables: JSON.stringify({
          height: 400,
          scale: 1,
          userID,
          width: 400
})
}
});
    return res.data.data.profile.profile_picture.uri;
} catch {
    return "https://i.ibb.co/bBSpr5v/143086968-2856368904622192-1959732218791162458-n.png";
}
}

async function createLeaveCard({ userID, username, threadName, threadID}) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");

  const avatarUrl = await getAvatarUrl(userID);
  const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  const background = await loadImage(backgroundUrl);
  const avatar = await loadImage(avatarUrl);

  // خلفية
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // صورة البروفايل في المنتصف
  const avatarSize = 160;
  const avatarX = canvas.width / 2 - avatarSize / 2;
  const avatarY = 50;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // بوردر أبيض حول الصورة
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2, true);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  // النصوص تحت الصورة
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Sans";
  ctx.textAlign = "center";

  ctx.fillText(`${username} كان رقاصة`, canvas.width / 2, avatarY + avatarSize + 40);
  ctx.font = "28px Sans";
  ctx.fillText(`وزع من ${threadName}`, canvas.width / 2, avatarY + avatarSize + 80);
  ctx.fillText(`بي وشك •-•`, canvas.width / 2, avatarY + avatarSize + 120);

  const outputPath = path.join(global.mainPath, "plugins/events/unsubcribeGifs", `${threadID}.png`);
  await fs.ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return fs.createReadStream(outputPath);
}

export default async function ({ event}) {
  const { api, botID} = global;
  const { threadID, author, logMessageData} = event;
  const { Threads, Users} = global.controllers;
  const getThread = await Threads.get(threadID) || {};
  const getThreadInfo = getThread.info || {};

  if (Object.keys(getThreadInfo).length === 0) return;

  const leftMemberIndex = getThreadInfo.members.findIndex(mem => mem.userID == logMessageData.leftParticipantFbId);
  if (leftMemberIndex> -1) {
    delete getThreadInfo.members[leftMemberIndex].exp;
}

  const type = (author == logMessageData.leftParticipantFbId)? "left": "kicked";
  const authorName = (await Users.getInfo(author))?.name || author;

  if (logMessageData.leftParticipantFbId == botID) {
    getThreadInfo.isSubscribed = false;

    let atlertMsg = getLang(`plugins.events.unsubcribe.bot.${type}`, {
      authorName,
      authorId: author,
      threadName: getThreadInfo.name,
      threadId: threadID
});

    for (const adid of global.config.MODERATORS) {
      global.sleep(300);
      if (adid!= threadID) {
        api.sendMessage(atlertMsg, adid);
}
}

    return;
}
const leftName = (await Users.getInfo(logMessageData.leftParticipantFbId))?.name || logMessageData.leftParticipantFbId;

  let atlertMsg = {
    body: (getThread?.data?.leaveMessage || getLang(`plugins.events.unsubcribe.${type}`))
.replace(/\{leftName}/g, leftName),
    mentions: [{
      tag: leftName,
      id: logMessageData.leftParticipantFbId
}]
};

  const leaveCard = await createLeaveCard({
    userID: logMessageData.leftParticipantFbId,
    username: leftName,
    threadName: getThreadInfo.name || threadID,
    threadID
});

  atlertMsg.attachment = [leaveCard];

  if (getThread?.data?.antiSettings?.antiOut && type === "left") {
    global.api.addUserToGroup(logMessageData.leftParticipantFbId, threadID, async (err) => {
      let needNotify = getThread?.data?.antiSettings?.notifyChange === true;
      if (err) {
        await api.sendMessage(atlertMsg, threadID);
        if (needNotify) global.api.sendMessage(getLang("plugins.events.unsubcribe.antiOut.error"), threadID);
} else {
        if (needNotify) global.api.sendMessage(getLang("plugins.events.unsubcribe.antiOut.success"), threadID);
}
});
} else {
    await api.sendMessage(atlertMsg, threadID);
}

  await Threads.updateInfo(threadID, {
    members: getThreadInfo.members,
    isSubscribed: getThreadInfo.isSubscribed
});

  return;
}
