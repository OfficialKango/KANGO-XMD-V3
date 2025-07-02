
require('./settings')
const makeWASocket = require("@whiskeysockets/baileys").default
const { makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, generateForwardMessageContent, generateWAMessageFromContent, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, Browsers, normalizeMessageContent } = require("@whiskeysockets/baileys")
const { color } = require('./kango/color')
const fs = require("fs");
const pino = require("pino");
const path = require('path')
const NodeCache = require("node-cache");
const msgRetryCounterCache = new NodeCache();
const fetch = require("node-fetch")
const FileType = require('file-type')
const _ = require('lodash')
const chalk = require('chalk')
const os = require('os');
const express = require('express')
const app = express();
const timezones = "Africa/Accra"; 
const moment = require("moment-timezone")
const readmore = String.fromCharCode(8206).repeat(4001);
const { File } = require('megajs');
const PhoneNumber = require("awesome-phonenumber");
const readline = require("readline");
const { formatSize, runtime, sleep, serialize, smsg, getBuffer } = require("./kango/myfunc")
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./kango/exif')
const { toAudio, toPTT, toVideo } = require('./kango/converter')

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) }); 

const low = require('./hector/kango-db');
const yargs = require('yargs/yargs');
const { Low, JSONFile } = low;
const port = process.env.PORT || 3000;
const versions = require("./package.json").version
const PluginManager = require('./kango/Plugins');
const pluginManager = new PluginManager(path.resolve(__dirname, './hector/commands'));

// Database
const dbName = "kango-db";
const dbPath = `${ownernumber}.json`;
const localDb = path.join(__dirname, "src", "database.json");

global.db = new Low(new JSONFile(localDb));

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise(resolve => setInterval(() => {
        if (!global.db.READ) {
            clearInterval(this);
            resolve(global.db.data ?? global.loadDatabase());
        }
    }, 1000));

    if (global.db.data !== null) return;

    global.db.READ = true;

    try {
        await global.db.read();
        
        if (!global.db.data || Object.keys(global.db.data).length === 0) {
            console.log("[KANGO-XMD] Syncing local database...");
            await readDB();
            await global.db.read();
        }

    } catch (error) {
        console.error("❌ Error loading database:", error);
    }

    global.db.READ = false;

    global.db.data ??= {};  // Ensure it's an object if null

    global.db.data = {
      chats: global.db.data.chats && Object.keys(global.db.data.chats).length ? global.db.data.chats : {},
      settings: global.db.data.settings && Object.keys(global.db.data.settings).length ? global.db.data.settings : {
        prefix: ".",
        mode: "public",
        autobio: false,
        anticall: false, 
        autotype: false,
        autoread: false,
        welcome: false,
        antiedit: "private",
        menustyle: "2",
        autoreact: false,
        statusemoji: "🧡",
        autorecord: false,
        antidelete: "private",
        alwaysonline: true,
        autoviewstatus: true,
        autoreactstatus: false,
        autorecordtype: false
      },
      blacklist: global.db.data.blacklist && Object.keys(global.db.data.blacklist).length ? global.db.data.blacklist : {
        blacklisted_numbers: []
      },
      sudo: Array.isArray(global.db.data.sudo) && global.db.data.sudo.length ? global.db.data.sudo : []
    };

    global.db.chain = _.chain(global.db.data);
    await global.db.write();
}; // <--- this closes the function

// GitHub Functions
async function getOctokit() {
    const { Octokit } = await import("@octokit/rest");
    return new Octokit({ auth: global.dbToken });
}

async function getOwner(octokit) {
    const user = await octokit.rest.users.getAuthenticated();
    return user.data.login;
}

async function createDB() {
    if (!global.dbToken) return;
    try {
        const octokit = await getOctokit();
        const owner = await getOwner(octokit);
        await octokit.repos.createForAuthenticatedUser({ name: dbName, private: true });
        console.log("[KANGO-XMD] Database created successfully.");
    } catch (error) {
        if (error.status === 422) {
            return;
        } else {
            console.error("❌ Error creating repository database:", error);
        }
    }
}

async function readDB() {
    if (!global.dbToken) return;
    try {
        const octokit = await getOctokit();
        const owner = await getOwner(octokit);
        const { data } = await octokit.repos.getContent({ owner, repo: dbName, path: dbPath });

        const content = Buffer.from(data.content, "base64").toString("utf-8");

        if (!content || content.trim() === "{}") {
            return;
        }
        const defaultSettings = {
            prefix: ".",
            mode: "public",
            autobio: false,
            anticall: false,
            autotype: false,
            autoread: false,
            welcome: false,
            antiedit: "private",
            menustyle: "2",
            autoreact: false,
            statusemoji: "🧡",
            autorecord: false,
            antidelete: "private",
            alwaysonline: true,
            autoviewstatus: true,
            autoreactstatus: false,
            autorecordtype: false
        };

        try {
            await global.db.read();
            const previousData = global.db.data || {};

            global.db.data = {
                chats: previousData.chats || {},
                settings: { ...defaultSettings, ...(previousData.settings || {}) },
                blacklist: previousData.blacklist || { blacklisted_numbers: [] },
                sudo: Array.isArray(previousData.sudo) ? previousData.sudo : []
            };

            global.db.chain = _.chain(global.db.data);
            await global.db.write();

            fs.writeFileSync(localDb, content);
            console.log("[KANGO-XMD] Synced local database successfully.");
        } catch (error) {
            if (error.status === 404) {
                console.log("[KANGO-XMD] Creating database....");
                await writeDB();
            } else {
                console.error("❌ Error reading database from GitHub:", error);
            }
        }

        global.writeDB = async function () {
            if (!global.dbToken) return;
            try {
                await global.db.write();

                const octokit = await getOctokit();
                const owner = await getOwner(octokit);
                const content = fs.readFileSync(localDb, "utf-8");
                let sha;

                try {
                    const { data } = await octokit.repos.getContent({ owner, repo: dbName, path: dbPath });
                    sha = data.sha;
                } catch (error) {
                    if (error.status !== 404) throw error;
                }

                await octokit.repos.createOrUpdateFileContents({
                    owner,
                    repo: dbName,
                    path: dbPath,
                    message: `Updated database`,
                    content: Buffer.from(content).toString("base64"),
                    sha,
                });

                console.log("[KANGO-XMD] Successfully synced database.");
            } catch (error) {
                console.error("❌ Error writing database to GitHub:", error);
            }
        };

    } catch (error) {
        console.error("❌ Error in readDB:", error);
    }
} // <--- ADD THIS TO FIX THE ERROR!


(async () => {
    if (global.dbToken) {
        await createDB();
        await readDB();
    }
    await global.loadDatabase();

    // Define global.mode to always reflect the DB
    Object.defineProperty(global, "mode", {
      get() { return global.db.data.settings.mode || "public" },
      set(val) { global.db.data.settings.mode = val }
    });

    // Now define modeStatus
    global.settings = global.db.data.settings;
  global.modeStatus = global.settings.mode === "public" ? "Public" : global.settings.mode === "private" ? "Private" : global.settings.mode === "group" ? "Group Only" : global.settings.mode === "pm" ? "PM Only" : "Unknown";

    // ...rest of your startup logic (startKango, etc)...
})();


if (global.dbToken) {
    setInterval(writeDB, 30 * 60 * 1000);
}

if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write();
}, 30 * 1000);

let phoneNumber = "233509977126"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")
const usePairingCode = true
const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});
return new Promise((resolve) => {
rl.question(text, resolve)
})
};
const axios = require("axios");

// Configuration (Ideally, load from a config file or environment variables)
const config = {
  owner: "OfficialKango",
  repo: "KANGO-XMD-LITE",
  currentVersion: "2.4.5", // Replace with your current version
};

async function checkForUpdates() {
  try {
    const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/releases/latest`;
    const response = await axios.get(apiUrl);
    const latestVersion = response.data.tag_name;

    // Robustly remove ALL leading 'v' characters
    const cleanedLatestVersion = latestVersion.replace(/^v+/g, "");
    const cleanedCurrentVersion = config.currentVersion.replace(/^v+/g, "");

    if (cleanedLatestVersion !== cleanedCurrentVersion) {
      return `🚀 Update available!\nLatest: v${cleanedLatestVersion}\nCurrent: v${cleanedCurrentVersion}`;
    } else {
      return `✅ KANGO-XMD is up to date (v${cleanedCurrentVersion}).`;
    }
  } catch (error) {
    if (error.response) {
      // API error
      return `⚠️ API Error: ${error.response.status} - ${error.response.statusText}`;
    } else if (error.request) {
      // Network error
      return `⚠️ Network Error: Could not reach GitHub API.`;
    } else {
      // Other error
      return `⚠️ Error checking for updates: ${error.message}`;
    }
  }
}
function cleanUp() {
  const _0x1c5d11 = [path.join(__dirname, ".npm"), path.join(__dirname, ".cache")];
  _0x1c5d11.forEach(_0x216fb8 => {
    if (fs.existsSync(_0x216fb8)) {
      try {
        fs.rmSync(_0x216fb8, {
          recursive: true,
          force: true
        });
      } catch (_0x4e9a98) {
        console.error("Error cleaning up " + _0x216fb8 + ":", _0x4e9a98);
      }
    }
  });
}


const storeFile = "./src/store.json";
const maxMessageAge = 24 * 60 * 60; //24 hours

function loadStoredMessages() {
    if (fs.existsSync(storeFile)) {
        try {
            return JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
            console.error("⚠️ Error loading store.json:", err);
            return {};
        }
    }
    return {};
}

function saveStoredMessages(chatId, messageId, messageData) {
    let storedMessages = loadStoredMessages();

    if (!storedMessages[chatId]) storedMessages[chatId] = {};
    if (!storedMessages[chatId][messageId]) {
        storedMessages[chatId][messageId] = messageData;
        fs.writeFileSync(storeFile, JSON.stringify(storedMessages, null, 2));
    }
} 

function cleanupOldMessages() {
    let now = Math.floor(Date.now() / 1000);
    let storedMessages = {};

    if (fs.existsSync(storeFile)) {
        try {
            storedMessages = JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
            console.error("❌ Error reading store.json:", err);
            return;
        }
    }

    let totalMessages = 0, oldMessages = 0, keptMessages = 0;

    for (let chatId in storedMessages) {
        let messages = storedMessages[chatId];

        for (let messageId in messages) {
            let messageTimestamp = messages[messageId].timestamp;

            if (typeof messageTimestamp === "object" && messageTimestamp.low !== undefined) {
                messageTimestamp = messageTimestamp.low;
            }

            if (messageTimestamp > 1e12) {
                messageTimestamp = Math.floor(messageTimestamp / 1000);
            }

            totalMessages++;

            if (now - messageTimestamp > maxMessageAge) {
                delete storedMessages[chatId][messageId];
                oldMessages++;
            } else {
                keptMessages++;
            }
        }
        
        if (Object.keys(storedMessages[chatId]).length === 0) {
            delete storedMessages[chatId];
        }
    }

    fs.writeFileSync(storeFile, JSON.stringify(storedMessages, null, 2));

    console.log("[KANGO-XMD] 🧹 Cleaning up:");
    console.log(`- Total messages processed: ${totalMessages}`);
    console.log(`- Old messages removed: ${oldMessages}`);
    console.log(`- Remaining messages: ${keptMessages}`);
}

async function loadAllPlugins() {
  try {
    await pluginManager.unloadAllPlugins();
    await pluginManager.loadPlugins();
  } catch (error) {
    console.log(`[KANGO-XMD] Error loading plugins: ${error.message}`);
  }
}

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

async function downloadSessionData() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true });
    
    if (!fs.existsSync(credsPath) && global.SESSION_ID) {
      const sessdata = global.SESSION_ID.split("KANGO~")[1];
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
      
      filer.download(async (err, data) => {
        if (err) throw err;
        await fs.promises.writeFile(credsPath, data);
        console.log(color(`[KANGO-XMD] Session saved successfully`, 'green'));
        await startKango();
      });
    }
  } catch (error) {
    console.error('Error downloading session data:', error);
  }
}


async function startKango() {
const {  state, saveCreds } =await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache(); 
    const Kango = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
       version: [2, 3000, 1017531287],
      browser: Browsers.ubuntu('Edge'),
     auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      markOnlineOnConnect: true, 
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
      
         let jid = jidNormalizedUser(key.remoteJid)
         let msg = await store.loadMessage(jid, key.id)

         return msg?.message || ""
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/@whiskeysockets/baileys/issues/276
   })
   
   store.bind(Kango.ev)
   
if(usePairingCode && !Kango.authState.creds.registered) {
    if (useMobile) throw new Error('Cannot use pairing code with mobile API');

        let phoneNumber;
       phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Enter Your WhatsApp Number Friend😄\nExample 233509977126:- `)))
        phoneNumber = phoneNumber.trim();

        setTimeout(async () => {
            const code = await Kango.requestPairingCode(phoneNumber);
      console.log(chalk.black(chalk.bgWhite(`[KANGO-XMD]:- ${code}`)));
        }, 3000);
    }


Kango.ev.on('connection.update', async (update) => {
	const {
		connection,
		lastDisconnect
	} = update      
try{

if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
if (lastDisconnect.error.output.statusCode === DisconnectReason.loggedOut)
console.log("Logged out. Please link again.");
if (lastDisconnect.error.output.statusCode === DisconnectReason.badSession)
console.log("Bad session. Log out and link again.");
startKango();
}

		if (update.connection == "connecting") {
			console.log(color(`[KANGO-XMD] Connecting...`, 'red'))
		}
		if (update.connection == "open") {
            console.log(color(`[KANGO-XMD] Connected`, 'green'))

// Wait for 2 seconds
await sleep(2000);

try {
  
  console.log("Group Invite: welcome to KANGO-XMD");
} catch (error) {
  console.log("An error occurred: " + (error.message || error));
}

// Function to accept a group invite with retries
async function acceptGroupInvite(inviteCode, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Kango.groupAcceptInvite(inviteCode);
      return;  // Success, exit function
    } catch (err) {
      if (attempt === maxRetries) {
        // Give up after max retries
        return;
      } else {
        // Wait 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

const inviteCode = "DnG8jaoSdmM1a1GglOmHeV";

// Try to accept the group invite with retries, then log success
acceptGroupInvite(inviteCode).then(() => {
  console.log("🚀 You're a member");
});

// Check for updates (assumed async function)
const updates = await checkForUpdates();
await Kango.sendMessage(Kango.user.id, {
  text:
    "╭༺◈*👑💖KANGO-XMD*\n" +
    "│📌 » *Username*: " + Kango.user.name + "\n" +
    "│💻 » *Platform*: " + os.platform() + "\n" +
    "│⚡ » *Prefix*: [ " + global.db.data.settings.prefix + " ]\n" +
    "│🚀 » *Mode*: " + modeStatus + "\n" +
    "│🤖 » *Version*: [ " + versions + " ]\n" +
    "╰───━━━༺◈༻━━━───╯\n\n" +
    "╭༺◈🚀 *𝗨𝗣𝗗𝗔𝗧𝗘𝗦* 🚀◈༻╮\n" + 
    "│" + updates + "\n" +  // Add the updates info
    "╰───━━━༺◈༻━━━───╯"
}, {
  ephemeralExpiration: 1800  // Keep it at 1800 as per your original setup
});
            }
	
} catch (err) {
	  console.log('Error in Connection.update '+err)
	  startKango();
	}
})

Kango.ev.on('creds.update', saveCreds);

Kango.ev.on('messages.upsert', async (chatUpdate) => {
  try {
    const messages = chatUpdate.messages;
    
    for (const kay of messages) {
      if (!kay.message) continue;
      
     kay.message = normalizeMessageContent(kay.message);

      if (kay.key && kay.key.remoteJid === 'status@broadcast') {
        if (global.db.data.settings.autoviewstatus === true) {
          await Kango.readMessages([kay.key]);
        }
        
        if (global.db.data.settings.autoreactstatus === true && global.db.data.settings.autoviewstatus === true) {
          const reactionEmoji = global.db.data.settings.statusemoji || '💚';
          const participant = kay.key.participant || kay.participant;
          const botJid = await Kango.decodeJid(Kango.user.id);
          const messageId = kay.key.id;
          
          if (participant && messageId && kay.key.id && kay.key.remoteJid) {
            await Kango.sendMessage(
              'status@broadcast',
              {
                react: {
                  key: {
                    id: kay.key.id, 
                    remoteJid: kay.key.remoteJid, 
                    participant: participant,
                  },
                  text: reactionEmoji,
                },
              },
              { statusJidList: [participant, botJid] }
            );
          }
        }
        
        continue; 
      }

if (
  kay.key.id.startsWith('BAE5') ||
  kay.key.id.startsWith('3EBO') && kay.key.id.length === 22 ||
  (!kay.key.id.startsWith('3EBO') && kay.key.id.length === 22) ||
  (kay.key.id.length !== 32 && kay.key.id.length !== 20)
) continue;

const processedMessages = new Set();
const messageId = kay.key.id;
if (processedMessages.has(messageId)) continue;
processedMessages.add(messageId);
      
      const m = smsg(Kango, kay, store);
// ==================== ANTI-DELETE HANDLER ==========//
if (
    kay.message?.protocolMessage?.type === 0 && 
    kay.message?.protocolMessage?.key
) {
    try {
        const mode = global.db.data.settings.antidelete || 'private';

        if (mode === 'off') return;

        const messageId = kay.message.protocolMessage.key.id;
        const chatId = kay.key.remoteJid;
        const deletedBy = kay.key.participant || kay.participant || (kay.key.fromMe ? Kango.user.id : kay.key.remoteJid);

        const storedMessages = loadStoredMessages();
        const deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
            console.log("⚠️ Deleted message not found in database.");
            return;
        }

        const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

        let chatName;
        if (deletedMsg.key.remoteJid === 'status@broadcast') {
            chatName = "Status Update";
        } else if (kay.key.remoteJid.endsWith('@g.us')) {
            try {
                const groupInfo = await Kango.groupMetadata(chatId);
                chatName = groupInfo.subject || "Group Chat";
            } catch {
                chatName = "Group Chat";
            }
        } else {
            chatName = deletedMsg.pushName || kay.pushName || "Private Chat";
        }

        const xtipes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
        const xdptes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

        const targetJid = (mode === 'private') ? Kango.user.id : chatId;

        if (!deletedMsg.message.conversation && !deletedMsg.message.extendedTextMessage) {
            try {
                let forwardedMsg = await Kango.sendMessage(
                    targetJid,
                    { 
                        forward: deletedMsg,
                        contextInfo: { isForwarded: false }
                    },
                    { quoted: deletedMsg }
                );

                let mediaInfo = `🚨 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝙳𝙸𝙰!* 🚨
${readmore}
𝙲𝙷𝙰𝚃: ${chatName}
𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
𝚃𝙸𝙼𝙴: ${xtipes}
𝙳𝙰𝚃𝙴: ${xdptes}
𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}`;

                await Kango.sendMessage(
                    targetJid, 
                    { text: mediaInfo, mentions: [sender, deletedBy] },
                    { quoted: forwardedMsg }
                );
            } catch (mediaErr) {
                console.error("Media recovery failed:", mediaErr);

                let replyText = `🚨 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🚨
${readmore}
𝙲𝙷𝙰𝚃: ${chatName}
𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
𝚃𝙸𝙼𝙴 𝚂𝙴𝙽𝚃: ${xtipes}
𝙳𝙰𝚃𝙴 𝚂𝙴𝙽𝚃: ${xdptes}
𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}

𝙼𝙴𝚂𝚂𝙰𝙶𝙴: [Unsupported media content]`;

                let quotedMessage = {
                    key: {
                        remoteJid: chatId,
                        fromMe: sender === Kango.user.id,
                        id: messageId,
                        participant: sender
                    },
                    message: { conversation: "Media recovery failed" }
                };

                await Kango.sendMessage(
                    targetJid,
                    { text: replyText, mentions: [sender, deletedBy] },
                    { quoted: quotedMessage }
                );
            }
        } else {
            let text = deletedMsg.message.conversation || 
                      deletedMsg.message.extendedTextMessage?.text;

            let replyText = `🚨 *𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴!* 🚨
${readmore}
𝙲𝙷𝙰𝚃: ${chatName}
𝚂𝙴𝙽𝚃 𝙱𝚈: @${sender.split('@')[0]} 
𝚃𝙸𝙼𝙴 𝚂𝙴𝙽𝚃: ${xtipes}
𝙳𝙰𝚃𝙴 𝚂𝙴𝙽𝚃: ${xdptes}
𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙱𝚈: @${deletedBy.split('@')[0]}

𝙼𝙴𝚂𝚂𝙰𝙶𝙴: ${text}`;

            let quotedMessage = {
                key: {
                    remoteJid: chatId,
                    fromMe: sender === Kango.user.id,
                    id: messageId,
                    participant: sender
                },
                message: {
                    conversation: text 
                }
            };

            await Kango.sendMessage(
                targetJid,
                { text: replyText, mentions: [sender, deletedBy] },
                { quoted: quotedMessage }
            );
        }

    } catch (err) {
        console.error("❌ Error processing deleted message:", err);
    }
}
// ==================== END ANTI-DELETE HANDLER ====================
      
      require('./system')(Kango, m, chatUpdate, store);
    }
  } catch (err) {
    console.error('Error handling messages.upsert:', err);
  }
});

Kango.ev.on("messages.upsert", async (chatUpdate) => {
    for (const msg of chatUpdate.messages) {
        if (!msg.message) return;

        let chatId = msg.key.remoteJid;
        let messageId = msg.key.id;

        saveStoredMessages(chatId, messageId, msg);
    }
});

setInterval(() => {
  try {
    const sessionPath = path.join(__dirname, 'session');
    fs.readdir(sessionPath, (err, files) => {
      if (err) {
        console.error("Unable to scan directory:", err);
        return;
      }

      const now = Date.now();
      const filteredArray = files.filter((item) => {
        const filePath = path.join(sessionPath, item);
        const stats = fs.statSync(filePath);

        return (
          (item.startsWith("pre-key") ||
           item.startsWith("sender-key") ||
           item.startsWith("session-") ||
           item.startsWith("app-state")) &&
          item !== 'creds.json' &&
          now - stats.mtimeMs > 2 * 24 * 60 * 60 * 1000
        );
      });

      if (filteredArray.length > 0) {
        console.log(`Found ${filteredArray.length} old session files.`);
        console.log(`Clearing ${filteredArray.length} old session files...`);

        filteredArray.forEach((file) => {
          const filePath = path.join(sessionPath, file);
          fs.unlinkSync(filePath);
        });
      } else {
        console.log("No old session files found.");
      }
    });
  } catch (error) {
    console.error('Error clearing old session files:', error);
  }
}, 7200000); 

setInterval(cleanupOldMessages, 60 * 60 * 1000);

function createTmpFolder() {
const folderName = "tmp";
const folderPath = path.join(__dirname, folderName);

if (!fs.existsSync(folderPath)) {
fs.mkdirSync(folderPath);
   }
 }
 
createTmpFolder();

setInterval(() => {
let directoryPath = path.join();
fs.readdir(directoryPath, async function (err, files) {
var filteredArray = await files.filter(item =>
item.endsWith("gif") ||
item.endsWith("png") || 
item.endsWith("mp3") ||
item.endsWith("mp4") || 
item.endsWith("opus") || 
item.endsWith("jpg") ||
item.endsWith("webp") ||
item.endsWith("webm") ||
item.endsWith("zip") 
)
if(filteredArray.length > 0){
let teks =`Detected ${filteredArray.length} junk files,\nJunk files have been deleted🚮`
Kango.sendMessage(Kango.user.id, {text : teks })
setInterval(() => {
if(filteredArray.length == 0) return console.log("Junk files cleared")
filteredArray.forEach(function (file) {
let sampah = fs.existsSync(file)
if(sampah) fs.unlinkSync(file)
})
}, 15_000)
}
});
}, 30_000)

Kango.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
} else return jid;
};

Kango.ev.on("contacts.update", (update) => {
for (let contact of update) {
let id = Kango.decodeJid(contact.id);
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
}
});

Kango.ev.on('group-participants.update', async ({ id, participants, action }) => {
  if (global.db.data.settings.welcome === true) {
    try {
      const groupData = await Kango.groupMetadata(id);
      const groupMembers = groupData.participants.length;
      const groupName = groupData.subject;

      for (const participant of participants) {
        const userPic = await getUserPicture(participant);
        const groupPic = await getGroupPicture(id);

        if (action === 'add') {
          sendWelcomeMessage(id, participant, groupName, groupMembers, userPic);
        } else if (action === 'remove') {
          sendGoodbyeMessage(id, participant, groupName, groupMembers, userPic);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
});

async function getUserPicture(userId) {
  try {
    return await Kango.profilePictureUrl(userId, 'image');
  } catch {
    return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60';
  }
}

async function getGroupPicture(groupId) {
  try {
    return await Kango.profilePictureUrl(groupId, 'image');
  } catch {
    return 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60';
  }
}

async function sendWelcomeMessage(groupId, participant, groupName, memberCount, profilePic) {
const welcomeMessage = `✨ *Welcome to ${groupName}!* ✨ @${participant.split('@')[0]}

You're our ${memberCount}th member!

Join time: ${moment.tz(`${timezones}`).format('HH:mm:ss')},  ${moment.tz(`${timezones}`).format('DD/MM/YYYY')}

Stay awesome!😊

> ${global.wm}`;
 Kango.sendMessage(groupId, {
    text: welcomeMessage,
    contextInfo: {
      mentionedJid: [participant],
      externalAdReply: {
        title: global.botname,
        body: ownername,
        previewType: 'PHOTO',
        thumbnailUrl: '',
        thumbnail: await getBuffer(profilePic),
        sourceUrl: plink
      }
    }
  });
}

async function sendGoodbyeMessage(groupId, participant, groupName, memberCount, profilePic) {
const goodbyeMessage = `✨ *Goodbye @${participant.split('@')[0]}!* ✨

You'll be missed in ${groupName}!🥲

We're now ${memberCount} members.

Left at: ${moment.tz(timezones).format('HH:mm:ss')},  ${moment.tz(timezones).format('DD/MM/YYYY')}

> ${global.wm}`;

  Kango.sendMessage(groupId, {
    text: goodbyeMessage,
    contextInfo: {
      mentionedJid: [participant],
      externalAdReply: {
        title: global.botname,
        body: ownername,
        previewType: 'PHOTO',
        thumbnailUrl: '',
        thumbnail: await getBuffer(profilePic),
        sourceUrl: plink
      }
    }
  });
}
//------------------------------------------------------
//anticall
Kango.ev.on('call', async (incomingCalls) => {
    let botId = await Kango.decodeJid(Kango.user.id);
    
    if (!["decline", "block"].includes(global.anticall)) return;

    console.log(incomingCalls);

    for (let call of incomingCalls) {
        if (!call.isGroup && call.status === "offer") { 
            let message = `🚨 *𝙲𝙰𝙻𝙻 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳!* 🚨\n\n`;
            message += `@${call.from.split('@')[0]}, my owner cannot receive ${call.isVideo ? `video` : `audio`} calls at the moment.\n\n`;

            if (global.anticall === "block") {
                message += `❌ You are being *blocked* for causing a disturbance. If this was a mistake, contact my owner to be unblocked.`;
            } else {
                message += `⚠️ Your call has been *declined*. Please avoid calling.`;
            }

            await Kango.sendTextWithMentions(call.from, message);
            await Kango.rejectCall(call.id, call.from);

            if (global.anticall === "block") {
                await sleep(8000);
                await Kango.updateBlockStatus(call.from, "block");
            }
        }
    }
});

Kango.serializeM = (m) => smsg(Kango, m, store)

Kango.getName = (jid, withoutContact = false) => {
id = Kango.decodeJid(jid);
withoutContact = Kango.withoutContact || withoutContact;
let v;
if (id.endsWith("@g.us"))
return new Promise(async (resolve) => {
v = store.contacts[id] || {};
if (!(v.name || v.subject)) v = Kango.groupMetadata(id) || {};
resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
});
else
v =
id === "0@s.whatsapp.net"
? {
id,
name: "WhatsApp",
}
: id === Kango.decodeJid(Kango.user.id)
? Kango.user
: store.contacts[id] || {};
return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
};

Kango.getFile = async (PATH, returnAsFilename) => {
    let res, filename;
    const data = Buffer.isBuffer(PATH) 
        ? PATH 
        : /^data:.*?\/.*?;base64,/i.test(PATH) 
        ? Buffer.from(PATH.split`, `[1], 'base64') 
        : /^https?:\/\//.test(PATH) 
        ? await (res = await fetch(PATH)).buffer() 
        : fs.existsSync(PATH) 
        ? (filename = PATH, fs.readFileSync(PATH)) 
        : typeof PATH === 'string' 
        ? PATH 
        : Buffer.alloc(0);

    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
    
    const type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
    
    if (returnAsFilename && !filename) {
        filename = path.join(__dirname, './tmp/' + new Date() * 1 + '.' + type.ext);
        await fs.promises.writeFile(filename, data);
    }
    
    const deleteFile = async () => {
        if (filename && fs.existsSync(filename)) {
            await fs.promises.unlink(filename).catch(() => {}); 
        }
    };

    setImmediate(deleteFile);
    data.fill(0); 
    
    return { res, filename, ...type, data, deleteFile };
};

Kango.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    const data = Buffer.from(buffer); 
    buffer.fill(0); 
    buffer = null;

    return data;
};

Kango.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
let type = await Kango.getFile(path, true)
let { res, data: file, filename: pathFile } = type
if (res && res.status !== 200 || file.length <= 65536) {
try { throw { json: JSON.parse(file.toString()) } }
catch (e) { if (e.json) throw e.json }
}
let opt = { filename }
if (quoted) opt.quoted = quoted
if (!type) options.asDocument = true
let mtype = '', mimetype = type.mime, convert
if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
else if (/video/.test(type.mime)) mtype = 'video'
else if (/audio/.test(type.mime)) (
convert = await (ptt ? toPTT : toAudio)(file, type.ext),
file = convert.data,
pathFile = convert.filename,
mtype = 'audio',
mimetype = 'audio/ogg; codecs=opus'
)
else mtype = 'document'
if (options.asDocument) mtype = 'document'

let message = {
...options,
caption,
ptt,
[mtype]: { url: pathFile },
mimetype
}
let m
try {
m = await Kango.sendMessage(jid, message, { ...opt, ...options })
} catch (e) {
console.error(e)
m = null
} finally {
if (!m) m = await Kango.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
return m
}
}

Kango.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message
}
}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo
}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo
}
} : {})
} : {})
await Kango.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage
}

Kango.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}
await Kango.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

Kango.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    let savePath = path.join(__dirname, 'tmp', trueFileName); // Save to 'tmp' folder

    await fs.writeFileSync(savePath, buffer);

    buffer = null; 
    global.gc?.(); 

    return savePath;
};

Kango.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await Kango.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}
Kango.sendText = (jid, text, quoted = '', options) => Kango.sendMessage(jid, { text: text, ...options }, { quoted })

Kango.sendTextWithMentions = async (jid, text, quoted, options = {}) => Kango.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

return Kango;
}

async function hector() {
    await cleanupOldMessages();
    await loadAllPlugins();
    if (fs.existsSync(credsPath)) {
        await startKango();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            await startKango();
        } else {
            if (!fs.existsSync(credsPath)) {
                if (!global.SESSION_ID) {
                    console.log(color("Please wait for a few seconds to enter your number!", 'red'));
             await startKango();
                }
            }
        }
    }
}

const porDir = path.join(__dirname, 'Media');
const porPath = path.join(porDir, 'kango.html');

// get runtime
function getUptime() {
    return runtime(process.uptime());
}

app.get("/", (req, res) => {
    res.sendFile(porPath);
});

app.get("/uptime", (req, res) => {
    res.json({ uptime: getUptime() });
});

app.listen(port, (err) => {
    if (err) {
        console.error(color(`Failed to start server on port: ${port}`, 'red'));
    } else {
        console.log(color(`[KANGO-XMD] Running on port: ${port}`, 'white'));
    }
});

hector();

module.exports.pluginManager = pluginManager
