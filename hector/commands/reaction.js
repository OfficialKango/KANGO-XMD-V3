const axios = require('axios');

const fetchReactionImage = async ({ Kango, m, reply, command }) => {
  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${command}`);
    await Kango.sendImageAsSticker(m.chat, data.url, m, {
      packname: global.packname,
      author: global.author,
    });
  } catch (error) {
    reply(`❌ Error fetching image: ${error.message}`);
  }
};

module.exports = [
  { command: ["8ball"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "8ball" }) },
  { command: ["avatar"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "avatar" }) },
  { command: ["awoo"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "awoo" }) },
  { command: ["bite"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "bite" }) },
  { command: ["blush"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "blush" }) },
  { command: ["bonk"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "bonk" }) },
  { command: ["bully"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "bully" }) },
  { command: ["cringe"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "cringe" }) },
  { command: ["cry"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "cry" }) },
  { command: ["cuddle"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "cuddle" }) },
  { command: ["dance"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "dance" }) },
  { command: ["feed"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "feed" }) },
  { command: ["foxgirl"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "foxgirl" }) },
  { command: ["gecg"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "gecg" }) },
  { command: ["glomp"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "glomp" }) },
  { command: ["goose"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "goose" }) },
  { command: ["handhold"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "handhold" }) },
  { command: ["happy"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "happy" }) },
  { command: ["highfive"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "highfive" }) },
  { command: ["hug"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "hug" }) },
  { command: ["kill"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "kill" }) },
  { command: ["kiss"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "kiss" }) },
  { command: ["lick"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "lick" }) },
  { command: ["lizard"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "lizard" }) },
  { command: ["meow"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "meow" }) },
  { command: ["nom"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "nom" }) },
  { command: ["pat"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "pat" }) },
  { command: ["poke"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "poke" }) },
  { command: ["shinobu"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "shinobu" }) },
  { command: ["slap"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "slap" }) },
  { command: ["smile"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "smile" }) },
  { command: ["smug"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "smug" }) },
  { command: ["spank"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "spank" }) },
  { command: ["tickle"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "tickle" }) },
  { command: ["wave"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "wave" }) },
  { command: ["wink"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "wink" }) },
  { command: ["woof"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "woof" }) },
  { command: ["yeet"], operate: async (Kangox) => fetchReactionImage({ ...Kangox, command: "yeet" }) },
];