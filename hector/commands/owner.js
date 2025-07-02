const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');
const AdmZip = require("adm-zip");
const axios = require("axios");
const { sleep } = require('../../kango/myfunc');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const { generateProfilePicture, downloadContentFromMessage } = require('@whiskeysockets/baileys'); 

module.exports = [ 
 {
  command: ['addbadword'],
  operate: async ({ Kango, m, isCreator, mess, prefix, args, q, bad, reply }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Use ${prefix}addbadword [harsh word].`);

    if (bad.includes(q)) {
      return reply('This word is already in the list!');
    }
    
    bad.push(q);

    try {
      await fsp.writeFile('./src/badwords.json', JSON.stringify(bad, null, 2));
      reply('Successfully added bad word!');
    } catch (error) {
      console.error('Error writing to badwords.json:', error);
      reply('An error occurred while adding the bad word.');
    }
  }
}, {
  command: ['addignorelist'],
  operate: async ({ m, args, isCreator, loadBlacklist, mess, reply }) => {
    if (!isCreator) return reply(mess.owner);

    let mentionedUser = m.mentionedJid && m.mentionedJid[0];
    let quotedUser = m.quoted && m.quoted.sender;
    let userToAdd = mentionedUser || quotedUser || m.chat;

    if (!userToAdd) return reply('Mention a user, reply to their message, or provide a phone number to ignore.');

    let blacklist = loadBlacklist();
    if (!blacklist.blacklisted_numbers.includes(userToAdd)) {
        blacklist.blacklisted_numbers.push(userToAdd);
        reply(`${userToAdd} added to the ignore list.`);
    } else {
        reply(`${userToAdd} is already ignored.`);
    }
  }
},
  {
  command: ['autobio'],
  operate: async ({ Kango, m, reply, args, prefix, command, isCreator, mess, db, botNumber }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Example: ${prefix + command} on/off`);

    const validOptions = ["on", "off"];
    const option = args[0].toLowerCase();

    if (!validOptions.includes(option)) return reply("Invalid option");

    db.data.settings[botNumber].autobio = option === "on";
    reply(`Auto-bio ${option === "on" ? "enabled" : "disabled"} successfully`);
  }
},
 {
  command: ['autoread'],
  operate: async ({ Kango, m, reply, args, prefix, command, isCreator, mess, db, botNumber }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Example: ${prefix + command} on/off`);

    const validOptions = ["on", "off"];
    const option = args[0].toLowerCase();

    if (!validOptions.includes(option)) return reply("Invalid option");

    db.data.settings[botNumber].autoread = option === "on";
    reply(`Auto-read ${option === "on" ? "enabled" : "disabled"} successfully`);
  }
}, {
  command: ['autorecord', 'autorecording'],
  operate: async ({ Kango, m, reply, args, prefix, command, isCreator, mess, db, botNumber }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Example: ${prefix + command} on/off`);

    const validOptions = ["on", "off"];
    const option = args[0].toLowerCase();

    if (!validOptions.includes(option)) return reply("Invalid option");
    
    db.data.settings[botNumber].autorecord = option === "on";
    reply(`Auto-record ${option === "on" ? "enabled" : "disabled"} successfully`);
  }
},
  {
  command: ['autotype', 'autotyping'],
  operate: async ({ Kango, m, reply, args, prefix, command, isCreator, mess, db, botNumber }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Example: ${prefix + command} on/off`);

    const validOptions = ["on", "off"];
    const option = args[0].toLowerCase();

    if (!validOptions.includes(option)) return reply("Invalid option");
    
    db.data.settings[botNumber].autotype = option === "on";
    reply(`Auto-typing ${option === "on" ? "enabled" : "disabled"} successfully`);
  }
},
 {
  command: ['autorecordtyping', 'autorecordtype'],
  operate: async ({ Kango, m, reply, args, prefix, command, isCreator, mess, db, botNumber }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Example: ${prefix + command} on/off`);

    const validOptions = ["on", "off"];
    const option = args[0].toLowerCase();

    if (!validOptions.includes(option)) return reply("Invalid option");
    
    db.data.settings[botNumber].autorecordtype = option === "on";
    reply(`Auto-record typing ${option === "on" ? "enabled" : "disabled"} successfully`);
  }
},
 {
  command: ['block'],
  operate: async ({ Kango, m, reply, isCreator, mess, text }) => {
    if (!isCreator) return reply(mess.owner);
    if (!m.quoted && !m.mentionedJid[0] && !text) return reply("Reply to a message or mention/user ID to block");

    const userId = m.mentionedJid[0] || m.quoted?.sender || text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    await Kango.updateBlockStatus(userId, "block");
    reply(mess.done);
  }
}, {
  command: ['deletebadword'],
  operate: async ({ Kango, m, isCreator, mess, prefix, args, q, bad, reply }) => {
    if (!isCreator) return reply(mess.owner);
    if (args.length < 1) return reply(`Use ${prefix}deletebadword [harsh word].`);

    const index = bad.indexOf(q);
    if (index === -1) {
      return reply('This word is not in the list!');
    }

    bad.splice(index, 1);

    try {
      await fsp.writeFile('./src/badwords.json', JSON.stringify(bad, null, 2));
      reply('Successfully deleted bad word!');
    } catch (error) {
      console.error('Error writing to badwords.json:', error);
      reply('An error occurred while deleting the bad word.');
    }
  }
},
 {
  command: ['delete', 'del'],
  operate: async ({ Kango, m, reply, isCreator, mess }) => {
    if (!isCreator) {
      return reply(mess.owner);
    }

    if (!m.quoted) {
      return reply(`*Please reply to a message you want to delete*`);
    }

    // --- Key for the Quoted Message ---
    if (!m.quoted.fakeObj || !m.quoted.fakeObj.key) {
      console.error("Quoted message key structure is missing:", m.quoted);
      return reply("*Could not retrieve details of the message to delete (quoted). It might be old or an unusual message type.*");
    }

    const quotedKeyInfo = m.quoted.fakeObj.key;

    if (!quotedKeyInfo.remoteJid || !quotedKeyInfo.id) {
        console.error("Essential properties (remoteJid or id) missing in quotedKeyInfo:", quotedKeyInfo);
        return reply("*Error: The quoted message key is incomplete. Cannot delete.*");
    }

    const keyToDeleteQuoted = {
      remoteJid: quotedKeyInfo.remoteJid,
      fromMe: quotedKeyInfo.fromMe,
      id: quotedKeyInfo.id,
      // Participant is typically needed for messages in a group NOT sent by the bot itself.
      // Adapt 'm.isGroup' based on your message object structure.
      participant: (m.isGroup && !quotedKeyInfo.fromMe) ? quotedKeyInfo.participant : undefined,
    };

    // --- Key for the Command Message ---
    // m.key refers to the key of the command message itself (e.g., "!delete")
    const keyToDeleteCommand = m.key;

    if (!keyToDeleteCommand || !keyToDeleteCommand.remoteJid || !keyToDeleteCommand.id) {
        console.error("Essential properties (remoteJid or id) missing in command message key:", keyToDeleteCommand);
        // Don't necessarily stop, as the primary goal is deleting the quoted message
        // but log it. The deletion of command message might fail.
    }


    try {
      // 1. Delete the quoted message
      await Kango.sendMessage(m.chat, { delete: keyToDeleteQuoted });
      // console.log("Successfully sent delete request for quoted message.");

      // 2. Attempt to delete the command message itself
      // This will only work if the bot has permission to delete the user's command message
      // (e.g., bot is admin in a group). It will fail in PMs or if not admin.
      if (keyToDeleteCommand && keyToDeleteCommand.remoteJid && keyToDeleteCommand.id) {
        try {
          await Kango.sendMessage(m.chat, { delete: keyToDeleteCommand });
          // console.log("Successfully sent delete request for command message.");
        } catch (commandDeleteError) {
          console.error("Failed to delete the command message:", commandDeleteError);
          // Optionally, you could inform the user if this specific deletion fails,
          // but it might be noisy. For now, we just log it.
          // The primary deletion (quoted message) was already attempted.
        }
      } else {
        console.warn("Command message key was incomplete, skipping its deletion.");
      }

    } catch (e) {
      console.error("Error during delete operation (likely quoted message):", e);
      reply("*An error occurred while trying to delete the quoted message. The bot might not have permission, or the message is too old.*");
    }
  }
},
{
  command: ['delignorelist'],
  operate: async ({ m, args, isCreator, loadBlacklist, mess, reply }) => {
    if (!isCreator) return reply(mess.owner);

    let mentionedUser = m.mentionedJid && m.mentionedJid[0];
    let quotedUser = m.quoted && m.quoted.sender;
    let userToRemove = mentionedUser || quotedUser || m.chat;

    if (!userToRemove) return reply('Mention a user, reply to their message, or provide a phone number to remove from the ignore list.');

    let blacklist = loadBlacklist();
    let index = blacklist.blacklisted_numbers.indexOf(userToRemove);
    if (index !== -1) {
        blacklist.blacklisted_numbers.splice(index, 1);
        reply(`${userToRemove} removed from the ignore list.`);
    } else {
        reply(`${userToRemove} is not in the ignore list.`);
    }
  }
},
 {
  command: ['deljunk', 'deletejunk', 'clearjunk'],
  operate: async (context) => {
    const { Kango, m, reply, isCreator, mess } = context;

    if (!isCreator) return reply(mess.owner);
    fsp.readdir("./session", async function (err, files) {
      if (err) {
        console.log("Unable to scan directory: " + err);
        return reply("Unable to scan directory: " + err);
      }
      let filteredArray = await files.filter(
        (item) =>
          item.startsWith("pre-key") ||
          item.startsWith("sender-key") ||
          item.startsWith("session-") ||
          item.startsWith("app-state")
      );
      console.log(filteredArray.length);
      await sleep(2000);
      reply(`*Clearing ${filteredArray.length} junk files in the session folder...*`);
      await filteredArray.forEach(function (file) {
        fs.unlinkSync(`./session/${file}`);
      });
      await sleep(2000);
      reply("*Successfully cleared all the junk files in the session's folder*");
    });

    const tmpDir = path.resolve("./tmp");
    fsp.readdir(tmpDir, async function (err, files) {
      if (err) {
        console.log("Unable to scan directory: " + err);
        return reply("Unable to scan directory: " + err);
      }
      let junkFiles = files.filter(
        (item) =>
          item.endsWith("gif") ||
          item.endsWith("png") || 
          item.endsWith("mp3") ||
          item.endsWith("mp4") || 
          item.endsWith("opus") || 
          item.endsWith("jpg") ||
          item.endsWith("webp") ||
          item.endsWith("webm") ||
          item.endsWith("zip")
      );
      console.log(junkFiles.length);
      await sleep(2000);
      reply(`*Clearing ${junkFiles.length} junk files in the tmp folder...*`);
      await junkFiles.forEach(function (file) {
        fs.unlinkSync(`${tmpDir}/${file}`);
      });
      await sleep(2000);
      reply("*Successfully cleared all the junk files in the tmp folder*");
    });
  }
}, {
  command: ["vv"],
  react: "👾",
  desc: "Owner Only - retrieve quoted view-once message",
  category: "owner",
  operate: async ({
    Kango: _0x4e1b84,
    m: _0x2650b3,
    reply: _0x6c7b71,
    isCreator: _0x4f2f8f
  }) => {
    // React with ⏳ at start
    await _0x4e1b84.sendMessage(_0x2650b3.chat, {
      react: {
        text: "⏳",
        key: _0x2650b3.key
      }
    });

    try {
      if (!_0x4f2f8f) {
        await _0x4e1b84.sendMessage(_0x2650b3.chat, {
          react: { text: "❌", key: _0x2650b3.key }
        });
        return _0x4e1b84.sendMessage(_0x2650b3.chat, {
          text: "*📛 This is an owner command.*"
        }, { quoted: _0x2650b3 });
      }

      if (!_0x2650b3.quoted) {
        await _0x4e1b84.sendMessage(_0x2650b3.chat, {
          react: { text: "❌", key: _0x2650b3.key }
        });
        return _0x4e1b84.sendMessage(_0x2650b3.chat, {
          text: "*🍁 Please reply to a view once message!*"
        }, { quoted: _0x2650b3 });
      }

      const _0x3df0f6 = await _0x2650b3.quoted.download();
      const _0x537cd4 = _0x2650b3.quoted.mtype;
      const _0x4cc45c = { quoted: _0x2650b3 };

      let _0x5c3ec6 = {};
      switch (_0x537cd4) {
        case "imageMessage":
          _0x5c3ec6 = {
            image: _0x3df0f6,
            caption: _0x2650b3.quoted.text || '',
            mimetype: _0x2650b3.quoted.mimetype || "image/jpeg"
          };
          break;
        case "videoMessage":
          _0x5c3ec6 = {
            video: _0x3df0f6,
            caption: _0x2650b3.quoted.text || '',
            mimetype: _0x2650b3.quoted.mimetype || "video/mp4"
          };
          break;
        case "audioMessage":
          _0x5c3ec6 = {
            audio: _0x3df0f6,
            mimetype: "audio/mp4",
            ptt: _0x2650b3.quoted.ptt || false
          };
          break;
        default:
          await _0x4e1b84.sendMessage(_0x2650b3.chat, {
            react: { text: "❌", key: _0x2650b3.key }
          });
          return _0x4e1b84.sendMessage(_0x2650b3.chat, {
            text: "❌ Only image, video, and audio messages are supported"
          }, { quoted: _0x2650b3 });
      }

      await _0x4e1b84.sendMessage(_0x2650b3.chat, _0x5c3ec6, _0x4cc45c);

      // React with ✅ on success
      await _0x4e1b84.sendMessage(_0x2650b3.chat, {
        react: {
          text: "✅",
          key: _0x2650b3.key
        }
      });

    } catch (_0x3e1173) {
      console.error("vv Error:", _0x3e1173);
      await _0x4e1b84.sendMessage(_0x2650b3.chat, {
        react: {
          text: "❌",
          key: _0x2650b3.key
        }
      });
      await _0x4e1b84.sendMessage(_0x2650b3.chat, {
        text: "❌ Error fetching vv message:\n" + _0x3e1173.message
      }, { quoted: _0x2650b3 });
    }
  }
},  {
  command: ['vv1'],
  operate: async ({ Kango, m, reply, isCreator, mess }) => {
    if (!isCreator) return reply(mess.owner);
    if (!m.quoted) return reply(`*Please reply to a view once message!*`);

    let msg = m.msg?.contextInfo?.quotedMessage
    let type = Object.keys(msg)[0];

    if (!/image|video/.test(type)) return reply(`*Only view once images and videos are supported!*`);

    try {
      let media = await downloadContentFromMessage(msg[type], type === 'imageMessage' ? 'image' : 'video');
      let buffer = Buffer.from([]);
      for await (const chunk of media) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      let filename = type === 'imageMessage' ? 'media.jpg' : 'media.mp4';
      let caption = msg[type]?.caption || global.wm;

      return Kango.sendFile(m.chat, buffer, filename, caption, m);
    } catch (error) {
      console.error(error);
      reply(`*Failed to retrieve media. The message might not be a valid view-once media.*`);
    }
  }
}, {
  command: ["vv2"],
  operate: async ({ Kango: David, m, reply, isCreator, mime, quoted, q }) => {
    // React with a floppy disk emoji to indicate saving
    await David.sendMessage(m.chat, { react: { text: `💾`, key: m.key } });

    if (!isCreator) {
      await David.sendMessage(m.chat, { react: { text: `❌`, key: m.key } });
      return reply('For My Owner Only');
    }

    try {
      let mediaType;

      if (/video/.test(mime)) {
        mediaType = 'video';
      } else if (/image/.test(mime)) {
        mediaType = 'image';
      } else if (/audio/.test(mime)) {
        mediaType = 'audio';
      } else {
        await David.sendMessage(m.chat, { react: { text: `❓`, key: m.key } });
        return reply('Reply to a Video, Image, or Audio You Want to Save');
      }

      const mediaFile = await David.downloadAndSaveMediaMessage(quoted);
      const messageOptions = {
        caption: q || ''
      };

      messageOptions[mediaType] = {
        url: mediaFile
      };

      await David.sendMessage(m.sender, messageOptions, { quoted: m });
      await David.sendMessage(m.chat, { react: { text: `✅`, key: m.key } });
    } catch (error) {
      console.error("Error saving media:", error);
      await David.sendMessage(m.chat, { react: { text: `🚫`, key: m.key } });
      reply('Failed to save and send the media.');
    }
  }
}, {
  command: ['disk'],
  operate: async ({ Kango, m, reply, isCreator, mess }) => {
    if (!isCreator) return reply(mess.owner);

    await reply('Please Wait');
    
    let o;
    try {
      o = await execAsync('cd && du -h --max-depth=1');
    } catch (e) {
      o = e;
    } finally {
      let { stdout, stderr } = o;
      if (stdout.trim()) reply(stdout);
      if (stderr.trim()) reply(stderr);
    }
  }
}, {
  command: ["active"],
  operate: async ({ Kango, m, reply, prefix }) => {
    try {
      // Capture the current timestamp at the start
      const startTimestamp = Date.now();

      // Send a message to indicate the bot is alive
      await Kango.sendMessage(m.chat, { text: "🚀 Checking Bot Status..." });

      const botInfo = {
        name: "KANGO-XMD",
        version: "2.4.2 🚀",
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        // Use the difference between start time and end time for responseTime
        responseTime: Date.now() - startTimestamp
      };

      const formatUptime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      };

      const formattedUptime = formatUptime(botInfo.uptime);

      // Constructing the bot's status message
      const statusMessage = `
💬 *Hello! I'm ${botInfo.name}* I'm fully operating 24/7 on your behalf!😎

⏰ *ᴜᴘᴛɪᴍᴇ:* ${formattedUptime} 🕒
💾 *ᴍᴇᴍᴏʀʏ ᴜsᴀɢᴇ:* ${botInfo.memoryUsage.toFixed(2)} MB 📊
⚡ *ʀᴇsᴘᴏɴᴄᴇ ᴛɪᴍᴇ:* ${botInfo.responseTime}ms 🏃‍♂️
🔧 *ʙᴏᴛ ᴠᴇʀsɪᴏɴ:* ${botInfo.version} 🔝

💡 _I'm here, alive, and ready to assist you with anything! Just type your command! 🤖💬_
      `.trim();

      // Sending the status message
      await Kango.sendMessage(m.chat, {
        text: statusMessage
      }, {
        quoted: m
      });
    } catch (error) {
      console.error("Error fetching bot status:", error);
      reply("❌ Oops! Something went wrong while checking my status. Here's the error: " + error.message);
    }
  }
}, {
  command: ["getpp"],
  operate: async ({ Kango: David, m, reply, prefix }) => {
    // React with a camera emoji to indicate fetching profile picture
    await David.sendMessage(m.chat, { react: { text: "📸", key: m.key } });

    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      await David.sendMessage(m.chat, { react: { text: "❓", key: m.key } });
      return reply(`Reply to someone's message or tag a user with ${prefix}getpp`);
    }

    try {
      const targetUser = m.quoted ? m.quoted.sender : m.mentionedJid[0];
      const profilePicUrl = await David.profilePictureUrl(targetUser, 'image');
      const responseMessage = `Profile picture of @${targetUser.split('@')[0]}`;
      await David.sendMessage(m.chat, {
        image: { url: profilePicUrl },
        caption: responseMessage,
        mentions: [targetUser]
      });
      // React with a checkmark on successful retrieval
      await David.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      // React with an 'X' on failure
      await David.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply("Couldn't fetch profile picture. The user might not have a profile picture or an error occurred.");
    }
  }
}, {
  command: ["checkupdate", "check"],
  tags: ["owner"],
  help: ["checkupdate"],
  operate: async ({ Kango, m, reply }) => {
    try {
      const fs = require("fs");
      const path = require("path");
      const axios = require("axios");

      await Kango.sendMessage(m.chat, {
        text: "🔍 Checking for new updates... Please wait.",
        react: { text: "✅", key: m.key }
      });

      const repoUrl = "https://api.github.com/repos/OfficialKango/KANGO-XMD/commits/main";
      const response = await axios.get(repoUrl, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const latestCommitHash = response.data.sha;
      const commitFilePath = path.join(__dirname, "..", "current_commit.json");

      if (fs.existsSync(commitFilePath)) {
        const currentCommit = JSON.parse(fs.readFileSync(commitFilePath, "utf-8")).commitHash;

        if (currentCommit !== latestCommitHash) {
          await reply("⚡️ *New update available!* A new version of the bot has been released.\nUse the `.update` command to fetch the latest changes.");
          fs.writeFileSync(commitFilePath, JSON.stringify({ commitHash: latestCommitHash }, null, 2));
        } else {
          await reply("✅ *Your bot is up-to-date!* No new updates found.");
        }
      } else {
        fs.writeFileSync(commitFilePath, JSON.stringify({ commitHash: latestCommitHash }, null, 2));
        await reply("✅ *Bot is now set up to check updates!* Type .check or .checkupdate once again");
      }
    } catch (err) {
      console.error("Update Check Error:", err.message);
      await reply("❌ *Error checking for updates!* Please try again later.");
    }
  }
}, {
  command: ["update"],
  tags: ["owner"],
  help: ["update"],
  operate: async ({ Kango, m, text, reply }) => {
    try {
      const fs = require("fs");
      const path = require("path");
      const axios = require("axios");

      // --- HARDCODED GITHUB TOKEN ---
      const GITHUB_TOKEN = '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'; // <-- Replace with your token
      const owner = "OfficialKango";
      const repo = "KANGO-XMD-V3";
      const branch = "main";
      const pkgPath = path.join(process.cwd(), "package.json");

      // 1. Get latest commit hash from remote
      const { data: latestCommit } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
      const latestHash = latestCommit.sha;

      // 2. Get local commit hash
      let currentHash = "unknown";
      if (fs.existsSync(pkgPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          currentHash = packageJson.commitHash || "unknown";
        } catch (e) {}
      }

      if (latestHash === currentHash) {
        return reply("✅ Your KANGO bot is already up-to-date!");
      }

      // 3. Get list of changed files
      const { data: compareData } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/compare/${currentHash}...${latestHash}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
      const changedFiles = compareData.files.map(f => f.filename);

      if (!changedFiles.length) {
        return reply("✅ No files to update!");
      }

      await reply(`🔄 Updating files:\n${changedFiles.map(f => `- ${f}`).join('\n')}`);

      // 4. Download and replace each changed file
      for (const file of changedFiles) {
        // Download raw file content from the latest commit
        const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${latestHash}/${file}`;
        const { data: fileContent } = await axios.get(fileUrl, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'User-Agent': 'node.js-update-script'
          }
        });

        // Ensure the local directory exists
        const localFilePath = path.join(process.cwd(), file);
        fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

        // Write the file
        fs.writeFileSync(localFilePath, fileContent);
      }

      // 5. Update commit hash in package.json
      let packageJson = {};
      if (fs.existsSync(pkgPath)) {
        packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      }
      packageJson.commitHash = latestHash;
      fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2));

      reply("✅ Bot updated to the latest version! Restarting...");

      setTimeout(() => process.exit(0), 2000);

    } catch (err) {
      console.error("Update error:", err);
      reply("❌ Update failed. Please try manually.");
    }
  }
}, {
  command: ["userinfo"],
  operate: async ({ Kango: Matrix, m, reply, prefix }) => {
    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
      return reply(`Reply to someone's message or tag a user with ${prefix}userinfo`);
    }

    try {
      const targetUser = m.quoted ? m.quoted.sender : m.mentionedJid[0];
      const phoneNumber = targetUser.split('@')[0];

      // Fetch profile picture
      const profilePicUrl = await Matrix.profilePictureUrl(targetUser, 'image').catch(() => null);

      const userInfoMessage = `
*User Info:*
- JID: ${targetUser}
- Phone Number: ${phoneNumber}
${profilePicUrl ? `- Profile Picture: [Click Here](${profilePicUrl})` : '- No Profile Picture'}
      `.trim();

      await Matrix.sendMessage(m.chat, {
        image: profilePicUrl ? { url: profilePicUrl } : undefined,
        caption: userInfoMessage,
        mentions: [targetUser]
      });

    } catch (error) {
      console.error("Error fetching user info:", error);
      reply("Couldn't fetch user information. The user might have privacy settings enabled.");
    }
  }
}, {
  command: ["groupid", "idgc"],
  operate: async ({
    Kango: _0x858a65,
    m: _0x263681,
    reply: _0x52fd2c,
    isCreator: _0x28b98e,
    mess: _0x154c39,
    args: _0x11dc19,
    q: _0x286173
  }) => {
    if (!_0x28b98e) {
      return _0x52fd2c(_0x154c39.owner);
    }
    if (!_0x286173) {
      return _0x52fd2c("Please provide a group link!");
    }
    let _0x3ade33 = _0x11dc19.join(" ");
    let _0x2903f0 = _0x3ade33.split("https://chat.whatsapp.com/")[1];
    if (!_0x2903f0) {
      return _0x52fd2c("Link Invalid");
    }
    _0x858a65.query({
      tag: "iq",
      attrs: {
        type: "get",
        xmlns: "w:g2",
        to: "@g.us"
      },
      content: [{
        tag: "invite",
        attrs: {
          code: _0x2903f0
        }
      }]
    }).then(async _0x186d1c => {
      const _0x5ea06e = "" + (_0x186d1c.content[0].attrs.id ? _0x186d1c.content[0].attrs.id : "undefined");
      _0x52fd2c(_0x5ea06e + "@g.us");
    });
  }
}, {
  command: ['gcaddprivacy'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, text, args }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Options: all/contacts/contact_blacklist/none\nExample: ${prefix + command} all`);

    const validOptions = ["all", "contacts", "contact_blacklist"];
    if (!validOptions.includes(args[0])) return reply("*Invalid option!*");

    await Kango.updateGroupsAddPrivacy(text);
    await reply(mess.done);
  }
},
  {
  command: ['getsession'],
  operate: async ({ Kango, m, reply, isCreator, mess }) => {
    if (!isCreator) return reply(mess.owner);
    reply("*Fetching session file...*");

    if (global.SESSION_ID) {
      Kango.sendMessage(
        m.chat,
        {
          text: `${global.SESSION_ID}`,
        },
        {
          quoted: m,
        }
      );
    }

    let botxp = fs.readFileSync("./session/creds.json");
    Kango.sendMessage(
      m.chat,
      {
        document: botxp,
        mimetype: "application/json",
        fileName: "creds.json",
      },
      {
        quoted: m,
      }
    );
  }
},
 {
  command: ['groupid', 'idgc'],
  operate: async ({ Kango, m, reply, isCreator, mess, args, q }) => {
    if (!isCreator) return reply(mess.owner);
    if (!q) return reply('Please provide a group link!');
    
    let linkRegex = args.join(" ");
    let coded = linkRegex.split("https://chat.whatsapp.com/")[1];
    if (!coded) return reply("Link Invalid");

    Kango.query({
      tag: "iq",
      attrs: {
        type: "get",
        xmlns: "w:g2",
        to: "@g.us"
      },
      content: [{ tag: "invite", attrs: { code: coded } }]
    }).then(async (res) => {
      const tee = `${res.content[0].attrs.id ? res.content[0].attrs.id : "undefined"}`;
      reply(tee + '@g.us');
    });
  }
}, {
  command: ['hostip', 'ipbot'],
  operate: async ({ Kango, m, reply, isCreator, mess }) => {
    if (!isCreator) return reply(mess.owner);

    https.get("https://api.ipify.org", (res) => {
      let data = '';
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => reply("Bot's public IP: " + data));
    });
  }
}, {
  command: ['join'],
  operate: async ({ Kango, m, reply, isCreator, mess, args, text, isUrl }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply("Enter group link");
    if (!isUrl(args[0]) && !args[0].includes("whatsapp.com")) return reply("Invalid link");

    try {
      const link = args[0].split("https://chat.whatsapp.com/")[1];
      await Kango.groupAcceptInvite(link);
      reply("Joined successfully");
    } catch {
      reply("Failed to join group");
    }
  }
}, {
  command: ["pinchat"],
  operate: async ({ Kango: David, m, reply, isCreator }) => {
    if (!isCreator) return reply('This command is for the owner only.');

    try {
      await David.chatModify({ pin: true }, m.chat);
      await David.sendMessage(m.chat, {
        react: {
          text: `📌`,
          key: m.key
        }
      });
    } catch (error) {
      console.error("Error pinning chat:", error);
      reply('Failed to pin the chat.');
    }
  }
}, {
  command: ["unpinchat"],
  operate: async ({ Kango: David, m, reply, isCreator }) => {
    if (!isCreator) return reply('This command is for the owner only.');

    try {
      await David.chatModify({ pin: false }, m.chat);
      await David.sendMessage(m.chat, {
        react: {
          text: `✅`,
          key: m.key
        }
      });
    } catch (error) {
      console.error("Error unpinning chat:", error);
      reply('Failed to unpin the chat.');
    }
  }
}, {
  command: ["listblock"],
  operate: async ({ Kango: David, reply, isCreator }) => {
    if (!isCreator) return reply("For My Owner Only");

    try {
      const block = await David.fetchBlocklist();
      if (!block || block.length === 0) {
        return reply("List Block:\n\n*0* Blocked");
      }

      const blockList = block.map(v => '• ' + v.replace(/@.+/, '')).join('\n');
      reply(`List Block:\n\n*${block.length}* Blocked\n${blockList}`);
    } catch (error) {
      console.error("Error fetching block list:", error);
      reply("Failed to retrieve block list.");
    }
  }
}, {
  command: ["listgc", "listgrup"],
  operate: async _0x5e2413 => {
    const {
      reply,
      isCreator,
      mess,
      Kango
    } = _0x5e2413;

    if (!isCreator) return reply(mess.owner);

    try {
      const data = await Kango.groupFetchAllParticipating();
      const groups = Object.values(data);
      let teks = `*乂 List of All Group Chats*\n\n`;
      teks += `*Total Groups:* ${groups.length}\n`;

      for (const g of groups) {
        const groupJid = g.id;
        let groupLink = "*Invite Link:* _Bot not admin_";

        try {
          const inviteCode = await Kango.groupInviteCode(groupJid);
          groupLink = `https://chat.whatsapp.com/${inviteCode}`;
        } catch (e) {
          // Bot not admin or error fetching link
        }

        teks += `\n━━━━━━━━━━━━━━━
*Group Name:* ${g.subject}
*Group ID:* \`\`\`${groupJid}\`\`\`
*Members:* ${g.participants.length}
*Status:* ${g.announce ? "Admin Only" : "Open"}
*Creator:* ${g.subjectOwner ? g.subjectOwner.split("@")[0] : "Left"}
${groupLink}`;
      }

      return reply(teks);
    } catch (e) {
      return reply("❌ Error listing groups.");
    }
  }
}, {
  command: ["join"],
  operate: async ({
    Kango: _0x16a3ee,
    m: _0xcc04be,
    reply: _0x3aabb6,
    isCreator: _0x3e6ceb,
    mess: _0x23ff01,
    args: _0x4750ac,
    text: _0x3303c9,
    isUrl: _0x143fb9
  }) => {
    // React with a handshake emoji to indicate joining
    await _0x16a3ee.sendMessage(_0xcc04be.chat, {
      react: {
        text: "🤝",
        key: _0xcc04be.key
      }
    });

    if (!_0x3e6ceb) {
      await _0x16a3ee.sendMessage(_0xcc04be.chat, {
        react: {
          text: "❌",
          key: _0xcc04be.key
        }
      });
      return _0x3aabb6(_0x23ff01.owner);
    }
    if (!_0x3303c9) {
      await _0x16a3ee.sendMessage(_0xcc04be.chat, {
        react: {
          text: "❓",
          key: _0xcc04be.key
        }
      });
      return _0x3aabb6("Enter group link");
    }
    if (!_0x143fb9(_0x4750ac[0]) && !_0x4750ac[0].includes("whatsapp.com")) {
      await _0x16a3ee.sendMessage(_0xcc04be.chat, {
        react: {
          text: "🔗", // Or "🚫" for invalid link
          key: _0xcc04be.key
        }
      });
      return _0x3aabb6("Invalid link");
    }
    try {
      const _0x3ecaf1 = _0x4750ac[0].split("https://chat.whatsapp.com/")[1];
      await _0x16a3ee.groupAcceptInvite(_0x3ecaf1);
      await _0x16a3ee.sendMessage(_0xcc04be.chat, {
        react: {
          text: "✅",
          key: _0xcc04be.key
        }
      });
      _0x3aabb6("Joined successfully");
    } catch {
      await _0x16a3ee.sendMessage(_0xcc04be.chat, {
        react: {
          text: "⚠️", // Or "❌" for failure
          key: _0xcc04be.key
        }
      });
      _0x3aabb6("Failed to join group");
    }
  }
}, {
  command: ['lastseen'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, text, args }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Options: all/contacts/contact_blacklist/none\nExample: ${prefix + command} all`);

    const validOptions = ["all", "contacts", "contact_blacklist", "none"];
    if (!validOptions.includes(args[0])) return reply("Invalid option");

    await Kango.updateLastSeenPrivacy(text);
    await reply(mess.done);
  }
}, {
  command: ['leave', 'leavegc'],
  operate: async ({ Kango, m, reply, isCreator, mess, sleep }) => {
    if (!isCreator) return reply(mess.owner);
    if (!m.isGroup) return reply(mess.group);

    reply("*Goodbye, it was nice being here!*");
    await sleep(3000);
    await Kango.groupLeave(m.chat);
  }
}, {
  command: ['listbadword'],
  operate: async ({ m, reply, isCreator, mess, bad }) => {
    if (!isCreator) return reply(mess.owner);
    if (m.isGroup) return reply('This command cannot be used in personal chats.');

    if (bad.length === 0) return reply('No bad words have been added yet.');

    let text = '*Bad Words List:*\n\n';
    bad.forEach((word, index) => {
      text += `${index + 1}. ${word}\n`;
    });

    text += `\nTotal bad words: ${bad.length}`;
    reply(text);
  }
},
{
  command: ['listignorelist'],
  operate: async ({ reply, loadBlacklist }) => {
    let blacklist = loadBlacklist();
    if (blacklist.blacklisted_numbers.length === 0) {
        reply('The ignore list is empty.');
    } else {
        reply(`Ignored users/chats:\n${blacklist.blacklisted_numbers.join('\n')}`);
    }
  }
}, {
  command: ['modestatus', 'botmode'],
  operate: async ({ Xploader, m, reply, isCreator, mess, modeStatus }) => {
    if (!isCreator) return reply(mess.owner);
    reply(`Current mode: ${modeStatus}`);
  }
},
  {
  command: ['online'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, text, args }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Options: all/match_last_seen\nExample: ${prefix + command} all`);

    const validOptions = ["all", "match_last_seen"];
    if (!validOptions.includes(args[0])) return reply("Invalid option");

    await Kango.updateOnlinePrivacy(text);
    await reply(mess.done);
  }
}, {
  command: ['owner'],
  operate: async ({ m, Kango, sender }) => {
    try {
      const senderName = await Kango.getName(sender);
      const botName = global.botname;
      const ownerName = global.ownername;
      const ownerNumber = global.ownernumber.replace(/[^0-9]/g, '');
      const contactLink = `wa.me/${ownerNumber}`;
      const PLINK = global.plink;

      const template = `
╭━━━[ *${botName} 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥* ]━━━╮

👋 Hello, *${senderName}*

🤖 I’m *${botName}*, your multi-functional..
 _WhatsApp Bot Assistant!_

╭─[ *OWNER DETAILS* ]──────────────
│ 🧠 *Name:* ${ownerName}
│ ☎️ *Contact:* ${contactLink}
│ ▶️ *YouTube:* ${ownerName} 
│       ${PLINK}
╰─────────────────────────────╯

> ⚡ *Powered by ${ownerName}*

╰━━━━━━━━━━━━━━━━━━━━━━━━╯`;

      await Kango.sendMessage(
        m.chat,
        { text: template.trim(), mentions: [sender] },
        { quoted: m }
      );
    } catch (error) {
      console.error('Error sending owner message:', error.message);
      await Kango.sendMessage(
        m.chat,
        { text: `*Error:* ${error.message}` },
        { quoted: m }
      );
    }
  },
}, {
  command: ['ppprivacy'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, text, args }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Options: all/contacts/contact_blacklist/none\nExample: ${prefix + command} all`);

    const validOptions = ["all", "contacts", "contact_blacklist", "none"];
    if (!validOptions.includes(args[0])) return reply("Invalid option");

    await Kango.updateProfilePicturePrivacy(text);
    await reply(mess.done);
  }
}, {
  command: ['react'],
  operate: async ({ Kango, m, reply, isCreator, mess, args, quoted }) => {
    if (!isCreator) return reply(mess.owner);
    if (!args) return reply(`*Reaction emoji needed*\n Example .react 🤔`);

    const reactionMessage = {
      react: {
        text: args[0],
        key: { remoteJid: m.chat, fromMe: true, id: quoted.id },
      },
    };
    Kango.sendMessage(m.chat, reactionMessage);
  }
},
  {
  command: ['readreceipts'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, text, args }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Options: all/none\nExample: ${prefix + command} all`);

    const validOptions = ["all", "none"];
    if (!validOptions.includes(args[0])) return reply("Invalid option");

    await Kango.updateReadReceiptsPrivacy(text);
    await reply(mess.done);
  }
}, {
  command: ["biography"],
  operate: async ({
    Kango: _0x56a354,
    m: _0x4303a2,
    reply: _0x5aafa4,
    text: _0x32bfab
  }) => {
    const biography = `
      *About the Developer:*

      
Hello, I am Hector Manuel, the developer behind this bot. I have a deep passion for programming and AI development, which has driven my journey in creating innovative solutions for users. I specialize in developing chatbots, automating tasks, and leveraging AI to enhance user experiences.

*Key Highlights:*

Self-taught developer with expertise in AI and machine learning.

Focused on building intelligent bots, web applications, and automation tools.

Enthusiastic about solving complex problems and contributing to open-source communities.


*Fun Facts:*

My go-to programming language is JavaScript, though I enjoy working with Python as well.

Automation is my passion—transforming mundane tasks into seamless processes.

When I’m not coding, I’m exploring new technologies and constantly expanding my skill set.


Thank you for using this bot! I hope you find its features helpful and enjoy the experience.

> You Can Recommend Me To Your Sister😂😂 

*Connect with Me:*

Telegram: https://t.me/official_kango

YouTube: https://youtube.com/@official_manuel

Email: officialkango73@gmail.com
      
    `;

    // Image URL or file path
    const imageUrl = "https://i.imgur.com/JhlUTaM.jpeg";  // Replace with your image URL

    // Send the biography and the image together
    await _0x56a354.sendMessage(_0x4303a2.chat, {
      text: biography
    });

    // Send the image separately
    await _0x56a354.sendMessage(_0x4303a2.chat, {
      image: { url: imageUrl }, // If you have the image URL
      caption: "*🌹Here's a picture of the creator!🌹*"
    });
  }
}, {
  command: ['reportbug'],
  operate: async ({ m, mess, text, Kango, isCreator, versions, prefix, reply, command }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Example: ${prefix + command} Hey, play command isn't working`);

    const bugReportMsg = `
*BUG REPORT*

*User*: @${m.sender.split("@")[0]}
*Issue*: ${text}

*Version*: ${versions}
    `;

    const confirmationMsg = `
Hi ${m.pushName},

Your bug report has been forwarded to my developer.
Please wait for a reply.

*Details:*
${bugReportMsg}
    `;

    Kango.sendMessage("233593734312@s.whatsapp.net", { text: bugReportMsg, mentions: [m.sender] }, { quoted: m });
    Kango.sendMessage(m.chat, { text: confirmationMsg, mentions: [m.sender] }, { quoted: m });
  }
},  {
  command: ["clearchat"],
  operate: async ({ Kango: Adiza, m }) => {
    try {
      await Adiza.chatModify(
        {
          delete: true,
          lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }]
        },
        m.chat
      );

      await Adiza.sendMessage(m.chat, {
        react: { text: "✅", key: m.key }
      });
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  }
}, {
  command: ['request'],
  operate: async ({ m, mess, text, Kango, isCreator, versions, prefix, command, reply }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`Example: ${prefix + command} I would like a new feature (specify) to be added.`);

    const requestMsg = `
*REQUEST*

*User*: @${m.sender.split("@")[0]}
*Request*: ${text}

*Version*: ${versions}
    `;

    const confirmationMsg = `
Hi ${m.pushName},

Your request has been forwarded to my developer.
Please wait for a reply.

*Details:*
${requestMsg}
    `;

    Kango.sendMessage("254754783972@s.whatsapp.net", { text: requestMsg, mentions: [m.sender] }, { quoted: m });
    Kango.sendMessage(m.chat, { text: confirmationMsg, mentions: [m.sender] }, { quoted: m });
  }
},
  {
  command: ['restart'],
  operate: async ({ Kango, m, reply, isCreator, mess }) => {
    if (!isCreator) return reply(mess.owner);
    reply(`*Restarting...*`);
    await sleep(3000);
    process.exit(0);
  }
},
 {
  command: ['setbio'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, text }) => {
    if (!isCreator) return reply(mess.owner);
    if (!text) return reply(`*Text needed*\nExample: ${prefix + command} ${global.botname}`);

    await Kango.updateProfileStatus(text);
    reply(`*Successfully updated bio to "${text}"*`);
  }
},
 {
  command: ['setprofilepic'],
  operate: async ({ Kango, m, reply, isCreator, mess, prefix, command, quoted, mime, args, botNumber }) => {
    if (!isCreator) return reply(mess.owner);
    if (!quoted) return reply(`*Send or reply to an image With captions ${prefix + command}*`);
    if (!/image/.test(mime)) return reply(`*Send or reply to an image With captions ${prefix + command}*`);
    if (/webp/.test(mime)) return reply(`*Send or reply to an image With captions ${prefix + command}*`);

    const medis = await Kango.downloadAndSaveMediaMessage(quoted, "ppbot.jpeg");

    if (args[0] === "full") {
      const { img } = await generateProfilePicture(medis);
      await Kango.query({
        tag: "iq",
        attrs: {
          to: botNumber,
          type: "set",
          xmlns: "w:profile:picture",
        },
        content: [
          {
            tag: "picture",
            attrs: {
              type: "image",
            },
            content: img,
          },
        ],
      });
      fs.unlinkSync(medis);
      reply(mess.done);
    } else {
      await Kango.updateProfilePicture(botNumber, {
        url: medis,
      });
      fs.unlinkSync(medis);
      reply(mess.done);
    }
  }
}, {
  command: ['toviewonce', 'tovo', 'tovv'],
  operate: async ({ Kango, m, reply, isCreator, mess, quoted, mime }) => {
    if (!isCreator) return reply(mess.owner);
    if (!quoted) return reply(`*Reply to an Image or Video*`);

    if (/image/.test(mime)) {
      const anuan = await Kango.downloadAndSaveMediaMessage(quoted);
      Kango.sendMessage(
        m.chat,
        {
          image: { url: anuan },
          caption: mess.done,
          fileLength: "999",
          viewOnce: true
        },
        { quoted: m }
      );
    } else if (/video/.test(mime)) {
      const anuanuan = await Kango.downloadAndSaveMediaMessage(quoted);
      Kango.sendMessage(
        m.chat,
        {
          video: { url: anuanuan },
          caption: mess.done,
          fileLength: "99999999",
          viewOnce: true
        },
        { quoted: m }
      );
    } else if (/audio/.test(mime)) {
      const bebasap = await Kango.downloadAndSaveMediaMessage(quoted);
      Kango.sendMessage(m.chat, {
        audio: { url: bebasap },
        mimetype: "audio/mpeg",
        ptt: true,
        viewOnce: true
      });
    }
  }
}, {
  command: ['unblock'],
  operate: async ({ Kango, m, reply, isCreator, mess, text }) => {
    if (!isCreator) return reply(mess.owner);
    if (!m.quoted && !m.mentionedJid[0] && !text) return reply("Reply to a message or mention/user ID to unblock");

    const userId = m.mentionedJid[0] || m.quoted?.sender || text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    await Kango.updateBlockStatus(userId, "unblock");
    reply(mess.done);
  }
}];