import { readdirSync, statSync, unlinkSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

const dirs = {}; // لكل محادثة مجلد خاص

const config = {
  name: "كمد",
  permissions: [2],
  description: "أوامر إدارة داخلية للملفات أو البيئة",
  usage: "[ls/cd/del/cer/get] [path]",
  credits: "Copilot & Xavia",
  cooldown: 5
};

async function onCall({ message, args }) {
  const { threadID } = message;
  const command = args?.toLowerCase();
  const target = args.slice(1).join(" ");

  if (!dirs[threadID]) dirs[threadID] = process.cwd();
  let currentDir = dirs[threadID];

  function safePath(pathInput) {
    return resolve(currentDir, pathInput || ".");
  }

  try {
    switch (command) {
      case "ls": {
        const pathToList = target? safePath(target): currentDir;
        if (!existsSync(pathToList)) return message.reply("📁 المسار غير موجود.");
        const files = readdirSync(pathToList);
        return message.reply(`📂 المحتويات:\n${files.join("\n")}`);
      }
      case "cd": {
        const pathToCheck = safePath(target);
        if (!existsSync(pathToCheck) ||!statSync(pathToCheck).isDirectory()) {
          return message.reply("❌ المجلد غير صالح أو غير موجود.");
        }
        dirs[threadID] = pathToCheck;
        return message.reply(`✅ تم تغيير المجلد إلى:\n${pathToCheck}`);
      }
      case "del": {
        const fileToDelete = safePath(target);
        if (!existsSync(fileToDelete)) return message.reply("🗑️ الملف غير موجود.");
        unlinkSync(fileToDelete);
        return message.reply(`✅ تم حذف الملف: ${target}`);
      }
      case "get": {
        const fileToRead = safePath(target);
        if (!existsSync(fileToRead)) return message.reply("📄 الملف غير موجود.");
        const content = readFileSync(fileToRead, "utf-8");
        return message.reply(`📄 محتوى الملف:\n${content.slice(0, 1500)}`);
      }
      case "cer": {
        return message.reply(`📜 تفاصيل البيئة:\nNode: ${process.version}\nPlatform: ${process.platform}\nMemory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
      }
      default:
        return message.reply("❓ الأمر غير معروف. استخدم: ls, cd, del, get, cer");
    }
  } catch (err) {
    console.error("Shell error:", err);
    return message.reply("❌ حدث خطأ أثناء تنفيذ الأمر.");
  }
}

export default {
  config,
  onCall
};
