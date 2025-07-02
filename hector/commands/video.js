
const fs = require('fs');
const { exec } = require('child_process');
const { getRandom } = require('../../kango/myfunc');

module.exports = [
 {
  command: ['volvideo'],
  operate: async ({ Kango, m, reply, args }) => {
  
  const quoted = m.quoted ? m.quoted : null;
  const mime = quoted?.mimetype || "";
      
    if (!args.join(" ")) return reply(`*Example: ${global.prefixz + command} 10*`);
   if (!quoted || !/video/.test(mime)) return reply(`Reply to an *video file* with *${prefix + command}* to adjust volume.`);

    try {
      const media = await Kango.downloadAndSaveMediaMessage(quoted, "volume");
      const rname = getRandom(".mp4");

      exec(`ffmpeg -i ${media} -filter:a volume=${args[0]} ${rname}`, (err, stderr, stdout) => {
        fs.unlinkSync(media);
        if (err) return reply("*Error!*");

        const jadie = fs.readFileSync(rname);
        Kango.sendMessage(
          m.chat,
          { video: jadie, mimetype: "video/mp4" },
          { quoted: m }
        );
        fs.unlinkSync(rname);
      });
    } catch (error) {
      console.error('Error processing video:', error);
      reply('An error occurred while processing the video.');
    }
  }
}, {
  command: ["tomp3"],
  tags: ["tools"],
  help: ["videotomp3 "],
  operate: async ({ Kango, m, quoted, reply }) => {
    await Kango.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    });
    if (!quoted || quoted.mtype !== "videoMessage") {
      await Kango.sendMessage(m.chat, {
        react: { text: "❌", key: m.key }
      });
      return reply("*Please reply to a video to convert it to MP3!*");
    }

    try {
      const { toMp3 } = require("../../kango/converter");
      const media = await quoted.download();
      const audio = await toMp3(media, "mp4"); // Specify input format as 'mp4'

      await Kango.sendMessage(m.chat, {
        audio: audio.data,
        mimetype: "audio/mpeg",
        ptt: false,
        quoted: m
      });
      await audio.delete?.();
      await Kango.sendMessage(m.chat, {
        react: { text: "✅", key: m.key }
      });
    } catch (e) {
      console.error(e);
      await Kango.sendMessage(m.chat, {
        react: { text: "❌", key: m.key }
      });
      reply("*Failed to convert video to MP3.*");
    }
  }
},
];