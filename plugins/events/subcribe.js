import { createCanvas, loadImage } from "canvas";
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

async function createWelcomeCard({ userID, username, threadName, memberNumber, threadID }) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");
  
  const avatarUrl = await getAvatarUrl(userID);
  const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  
  const background = await loadImage(backgroundUrl);
  const avatar = await loadImage(avatarUrl);
  
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  
  const avatarSize = 150;
  const avatarX = 50;
  const avatarY = canvas.height / 2 - avatarSize / 2;
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();
  
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Sans";
  ctx.fillText(`مرحباً ${username}`, 230, 150);
  ctx.fillText(`في ${threadName}`, 230, 200);
  ctx.fillText(`عضو رقم ${memberNumber}`, 230, 250);
  
  const outputPath = path.join(global.mainPath, "plugins/events/subcribeGifs", `${threadID}.png`);
  await fs.ensureDir(path.dirname(outputPath));
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
  
  return fs.createReadStream(outputPath);
}

export default async function({ event }) {
  const { api } = global;
  const { threadID, author, logMessageData } = event;
  const { Threads, Users } = global.controllers;
  const getThread = (await Threads.get(threadID)) || {};
  const getThreadData = getThread.data || {};
  const getThreadInfo = getThread.info || {};
  
  if (Object.keys(getThreadInfo).length > 0) {
    for (const user of logMessageData.addedParticipants) {
      if (!getThreadInfo.members.some(mem => mem.userID == user.userFbId)) {
        getThreadInfo.members.push({ userID: user.userFbId });
      }
    }
  }
  
  const authorName = (await Users.getInfo(author))?.name || author;
  
  const joinNameArray = [],
    mentions = [],
    warns = [];
  for (const participant of logMessageData.addedParticipants) {
    let uid = participant.userFbId;
    if (getThreadInfo.members.some(mem => mem.userID == uid && mem?.warns?.length >= 3)) {
      warns.push(uid);
      continue;
    }
    
    const joinName = participant.fullName;
    joinNameArray.push(joinName);
    mentions.push({ id: uid, tag: joinName });
  }
  
  if (warns.length > 0) {
    for (const uid of warns) {
      await new Promise(resolve => {
        api.removeUserFromGroup(uid, threadID, err => {
          if (err) return resolve();
          const username = logMessageData.addedParticipants.find(i => i.userFbId == uid).fullName;
          api.sendMessage({
            body: getLang("plugins.events.subcribe.warns", { username }),
            mentions: [{ id: uid, tag: username }]
          }, threadID, () => resolve());
        });
      });
    }
  }
  let oldMembersLength = getThreadInfo.members.length - joinNameArray.length;
  let newCount = joinNameArray.map((_, i) => i + oldMembersLength + 1);
  
  let atlertMsg = {
    body: (getThreadData?.joinMessage || getLang("plugins.events.subcribe.welcome"))
      .replace(/\{members}/g, joinNameArray.join(", "))
      .replace(/\{newCount}/g, newCount.join(", "))
      .replace(/\{threadName}/g, getThreadInfo.name || threadID),
    mentions
  };
  
  if (logMessageData.addedParticipants.length === 1 && warns.length === 0) {
    const welcomeCard = await createWelcomeCard({
      userID: logMessageData.addedParticipants[0].userFbId,
      username: logMessageData.addedParticipants[0].fullName,
      threadName: getThreadInfo.name || threadID,
      memberNumber: newCount[0],
      threadID
    });
    
    atlertMsg.attachment = [welcomeCard];
  }
  
  if (joinNameArray.length > 0) {
    api.sendMessage(atlertMsg, threadID);
  }
  
  await Threads.updateInfo(threadID, {
    members: getThreadInfo.members,
    isSubscribed: getThreadInfo.isSubscribed
  });
  
  return;
}