const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const yts = require('yt-search');

module.exports = [  {
  command: ["dictionary"],
  operate: async ({
    Kango: _0x52ad33,
    m: _0x236b21,
    reply: _0x4f3082,
    text: _0x1c5889
  }) => {
    if (!_0x1c5889) {
      return _0x4f3082("Ready to rumble with words? 💪📖  What word is puzzling you? 🤔 Let's conquer the dictionary! 📚⚔️ Tell me your word and let's see what we find! 🤩.");
    }
    try {
      const _0x498ddf = await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + _0x1c5889);
      const _0x2e1bad = await _0x498ddf.json();
      if (!_0x2e1bad.length) {
        throw new Error();
      }
      const _0xc470c7 = _0x2e1bad[0].meanings[0].definitions.map((_0xe44f19, _0x8e13ba) => "*Definition " + (_0x8e13ba + 1) + ":* " + _0xe44f19.definition).join("\n\n");
      _0x52ad33.sendMessage(_0x236b21.chat, {
        text: "📖 *Definitions for:* " + _0x1c5889 + "\n\n" + _0xc470c7
      }, {
        quoted: _0x236b21
      });
    } catch (_0x1af231) {
      _0x4f3082("❌ No definition found for *" + _0x1c5889 + "*");
    }
  }
}, {
  command: ["dictionary2"],
  operate: async ({
    m: _0x3bef50,
    text: _0x558d73,
    Kango: _0x27bb39,
    reply: _0x32ec02
  }) => {
    if (!_0x558d73) {
      return _0x32ec02("Hey there, word wizard! ✨ What word are you curious about today? 🤔 Let's dive into the dictionary! 📚📖  Tell me your word and let's have some fun! 🥳?");
    }
    try {
      const {
        data: _0x533b21
      } = await axios.get("http://api.urbandictionary.com/v0/define?term=" + _0x558d73);
      if (!_0x533b21.list.length) {
        throw new Error();
      }
      const _0x1eb6d6 = _0x533b21.list[0].definition.replace(/|/g, "");
      const _0x2e866c = _0x533b21.list[0].example.replace(/|/g, "");
      _0x27bb39.sendMessage(_0x3bef50.chat, {
        text: "📖 *Urban Definition of:* " + _0x558d73 + "\n\n*Definition:* " + _0x1eb6d6 + "\n\n*Example:* " + _0x2e866c
      }, {
        quoted: _0x3bef50
      });
    } catch (_0x357401) {
      _0x32ec02("❌ No definition found for *" + _0x558d73 + "*");
    }
  }
}, {
  command: ["tiktokinfo", "tiktokstalk", "ttstalk"],
  desc: "Fetch TikTok user profile details.",
  category: "search",
  react: "📱",
  filename: __filename,
  operate: async ({
    m: _0x4381e7,
    args: _0x377205,
    fetchJson: _0x15d24e,
    Kango: _0x2bb4b0,
    reply: _0x49759b
  }) => {
    if (!_0x377205[0]) {
      await _0x2bb4b0.sendMessage(_0x4381e7.chat, {
        react: {
          text: "❌",
          key: _0x4381e7.key
        }
      });
      return _0x49759b("❎ Please provide a TikTok username.\n\n*Example:* .tiktokinfo mrbeast");
    }

    try {
      await _0x2bb4b0.sendMessage(_0x4381e7.chat, {
        react: {
          text: "⏳",
          key: _0x4381e7.key
        }
      });

      const _0x4e1b4d = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(_0x377205[0])}`;
      const _0x2b9f31 = await _0x15d24e(_0x4e1b4d);

      if (!_0x2b9f31.status) {
        await _0x2bb4b0.sendMessage(_0x4381e7.chat, {
          react: {
            text: "❌",
            key: _0x4381e7.key
          }
        });
        return _0x49759b("❌ User not found. Please check the username and try again.");
      }

      const _0x2ea997 = _0x2b9f31.data.user;
      const _0x1c184e = _0x2b9f31.data.stats;

      const _0x5c39a5 = `🎭 *TikTok Profile Stalker* 🎭

👤 *Username:* @${_0x2ea997.uniqueId}
📛 *Nickname:* ${_0x2ea997.nickname}
✅ *Verified:* ${_0x2ea997.verified ? "Yes ✅" : "No ❌"}
📍 *Region:* ${_0x2ea997.region}
📝 *Bio:* ${_0x2ea997.signature || "No bio available."}
🔗 *Bio Link:* ${_0x2ea997.bioLink?.link || "No link available."}

📊 *Statistics:*
👥 *Followers:* ${_0x1c184e.followerCount.toLocaleString()}
👤 *Following:* ${_0x1c184e.followingCount.toLocaleString()}
❤️ *Likes:* ${_0x1c184e.heartCount.toLocaleString()}
🎥 *Videos:* ${_0x1c184e.videoCount.toLocaleString()}

📅 *Account Created:* ${new Date(_0x2ea997.createTime * 1000).toLocaleDateString()}
🔒 *Private Account:* ${_0x2ea997.privateAccount ? "Yes 🔒" : "No 🌍"}

🔗 *Profile URL:* https://www.tiktok.com/@${_0x2ea997.uniqueId}
`;

      await _0x2bb4b0.sendMessage(_0x4381e7.chat, {
        image: { url: _0x2ea997.avatarLarger },
        caption: _0x5c39a5
      }, {
        quoted: _0x4381e7
      });

      await _0x2bb4b0.sendMessage(_0x4381e7.chat, {
        react: {
          text: "✅",
          key: _0x4381e7.key
        }
      });

    } catch (_0x3f85cc) {
      console.error("❌ TikTok stalk error:", _0x3f85cc);
      await _0x2bb4b0.sendMessage(_0x4381e7.chat, {
        react: {
          text: "❌",
          key: _0x4381e7.key
        }
      });
      _0x49759b("⚠️ An error occurred while fetching TikTok profile data.");
    }
  }
}, {
  command: ["check-apikey", "apikeystatus"],
  operate: async ({ m, text, reply }) => {
    if (!text) {
      return reply("Please provide your API key or a full API URL.\nExample:\n*.check-apikey MatrixZatKing*\n*.check-apikey https://api.nexoracle.com/check/apikey?apikey=MatrixZatKing*");
    }

    let url = "";
    if (text.includes("http")) {
      url = text.trim();
    } else {
      // If only API key is provided, use the API status checker
      url = `https://api.nexoracle.com/check/apikey?apikey=${encodeURIComponent(text.trim())}`;
    }

    try {
      const res = await axios.get(url);
      const data = res.data;

      if (!data || !data.result) {
        return reply("❌ Invalid or expired API key.");
      }

      let message = "🔍 *API Key Status:*\n\n";
      message += "👤 *Owner:* " + data.owner + "\n";
      message += "📛 *Username:* " + data.result.Username + "\n";
      message += "💳 *Plan:* " + data.result.Plan + "\n";
      message += "🔢 *API Limit:* " + data.result.Api_Limit + "\n";
      message += "📅 *Expiry Date:* " + data.result.Expirey_Date + "\n";
      message += "✅ *Message:* " + data.result.Message + "\n";

      reply(message);
    } catch (err) {
      console.error("API key check error:", err?.response?.data || err.message);
      reply("*An error occurred while checking the API key.*");
    }
  }
}, {
  command: ["domain-details"],
  operate: async ({ m, text, reply, Kango }) => {
    try {
      const axios = require("axios");
      const domain = text.trim().toLowerCase();

      if (!domain || !/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(domain)) {
        return reply("*Invalid domain format.* Please enter a valid domain like \"example.com\"");
      }

      const url = `https://api.nexoracle.com/details/domain?apikey=MatrixZatKing&q=${encodeURIComponent(domain)}`;
      const res = await axios.get(url);
      const data = res.data;

      if (!data?.result) {
        return reply(`*No details found* for domain: "${domain}". It might not be available.`);
      }

      // Remove duplicates from the result array
      const uniqueSubdomains = [...new Set(data.result)];

      let message = `🔍 *Domain Details for:* "${domain}"\n\n`;
      message += "🌐 *Subdomains:*\n";

      if (uniqueSubdomains.length > 0) {
        uniqueSubdomains.forEach(subdomain => {
          message += `- ${subdomain}\n`;
        });
      } else {
        message += "No subdomains found.\n";
      }

      reply(message);
    } catch (err) {
      console.error("Error fetching domain details:", err);
      reply("*An error occurred* while fetching domain details. Please try again later.");
    }
  }
}, {
  command: ["wiki", "wikipedia"],
  operate: async ({ Kango: sock, m, reply, text }) => {
    if (!text) return reply("*Please provide a search term*\nExample: .wiki Elon Musk");

    await sock.sendMessage(m.chat, {
      react: { text: "📚", key: m.key }
    });

    try {
      const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
      const data = res.data;

      if (data.extract) {
        let response = `*${data.title}*\n\n${data.extract}`;
        if (data.content_urls?.desktop?.page) {
          response += `\n\n🔗 More info: ${data.content_urls.desktop.page}`;
        }
        reply(response);
      } else {
        reply("*No results found on Wikipedia for:* " + text);
      }
    } catch (err) {
      console.error("Wikipedia error:", err.message);
      reply("*Failed to fetch from Wikipedia. Try again later.*");
    }
  }
}, {
  command: ["lyrics"],
  operate: async ({
    m: _0x43c434,
    text: _0xd760ca,
    Kango: _0xa8cd1,
    reply: _0x353bbc
  }) => {
    if (!_0xd760ca) {
      return _0x353bbc("Provide a song name.");
    }
    try {
      const _0x5aa356 = "https://xploader-api.vercel.app/lyrics?query=" + encodeURIComponent(_0xd760ca);
      const _0x87b88 = await fetch(_0x5aa356);
      const _0x149136 = await _0x87b88.json();
      if (!_0x149136.length || !_0x149136[0].song || !_0x149136[0].artist || !_0x149136[0].lyrics) {
        throw new Error();
      }
      _0xa8cd1.sendMessage(_0x43c434.chat, {
        text: "🎵 *Lyrics for:* " + _0x149136[0].song + " - " + _0x149136[0].artist + "\n\n" + _0x149136[0].lyrics
      }, {
        quoted: _0x43c434
      });
    } catch (_0x2077ed) {
      console.error("❌ Unable to fetch lyrics:", _0x2077ed);
      _0x353bbc("❌ Unable to fetch lyrics.");
    }
  }
}, {
  command: ["lyrics2"],
  operate: async ({ m, text, Kango, reply }) => {
    if (!text) {
      return reply("Provide a song name.");
    }
    try {
      const apiUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(text)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unable to parse error response" }));
        return reply(`API request failed with status ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.title || !data.artist || !data.lyrics) {
        return reply("Lyrics not found for this song."); //Handle cases where the API doesn't find lyrics
      }

      const lyrics = `🎵 *Lyrics for:* ${data.title} - ${data.artist}\n\n${data.lyrics}`;
      Kango.sendMessage(m.chat, { text: lyrics }, { quoted: m });
    } catch (error) {
      console.error("❌ Unable to fetch lyrics:", error);
      reply("❌ Unable to fetch lyrics.");
    }
  }
}, {
  command: ["shazam"],
  operate: async ({
    Kango: _0x56a354, // Assuming 'Kango' is the object for sending messages
    m: _0x4bbe0b,
    acr: _0x31f753,
    reply: _0x3284f3,
    fs // Assuming 'fs' module is available
  }) => {
    // React with a musical note emoji to indicate music identification attempt
    await _0x56a354.sendMessage(_0x4bbe0b.chat, {
      react: {
        text: "🎶",
        key: _0x4bbe0b.key
      }
    });

    const _0x7ad334 = _0x4bbe0b.quoted ? _0x4bbe0b.quoted : null || _0x4bbe0b.msg;
    const _0x277fb4 = _0x7ad334?.mimetype || "";
    if (!_0x7ad334 || !/audio|video/.test(_0x277fb4)) {
      await _0x56a354.sendMessage(_0x4bbe0b.chat, {
        react: {
          text: "❓",
          key: _0x4bbe0b.key
        }
      });
      return _0x3284f3("Reply to an audio or video to identify music.");
    }
    try {
      const _0x5036b4 = await _0x4bbe0b.quoted.download();
      const _0x28ff6a = "./tmp/" + _0x4bbe0b.sender + "." + _0x277fb4.split("/")[1];
      fs.writeFileSync(_0x28ff6a, _0x5036b4);
      const _0x43e30b = await _0x31f753.identify(fs.readFileSync(_0x28ff6a));
      fs.unlinkSync(_0x28ff6a);
      if (_0x43e30b.status.code !== 0) {
        await _0x56a354.sendMessage(_0x4bbe0b.chat, {
          react: {
            text: "❌",
            key: _0x4bbe0b.key
          }
        });
        throw new Error(_0x43e30b.status.msg);
      }
      const {
        title: _0x4c18d8,
        artists: _0x41887c,
        album: _0x3122d6,
        release_date: _0xda3f56
      } = _0x43e30b.metadata.music[0];
      const _0x28bacb = "🎵 *Music Identified!*\n\n*Title:* " + _0x4c18d8 + "\n*Artist(s):* " + _0x41887c.map(_0x2f80d9 => _0x2f80d9.name).join(", ") + "\n" + ("*Album:* " + (_0x3122d6.name || "Unknown") + "\n*Release Date:* " + (_0xda3f56 || "Unknown"));
      await _0x56a354.sendMessage(_0x4bbe0b.chat, {
        react: {
          text: "✅",
          key: _0x4bbe0b.key
        }
      });
      _0x3284f3(_0x28bacb);
    } catch (_0x1b3e4c) {
      await _0x56a354.sendMessage(_0x4bbe0b.chat, {
        react: {
          text: "❌",
          key: _0x4bbe0b.key
        }
      });
      _0x3284f3("❌ Unable to identify the music.");
    }
  }
}, {
    command: ['imdb', 'movie'],
    operate: async ({ Kango, m, reply, text }) => {
      if (!text) return reply("Provide a movie or series name.");
      
      try {
        const { data } = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${text}&plot=full`);
        if (data.Response === "False") throw new Error();

        const imdbText = `🎬 *IMDB SEARCH*\n\n`
          + `*Title:* ${data.Title}\n*Year:* ${data.Year}\n*Rated:* ${data.Rated}\n`
          + `*Released:* ${data.Released}\n*Runtime:* ${data.Runtime}\n*Genre:* ${data.Genre}\n`
          + `*Director:* ${data.Director}\n*Actors:* ${data.Actors}\n*Plot:* ${data.Plot}\n`
          + `*IMDB Rating:* ${data.imdbRating} ⭐\n*Votes:* ${data.imdbVotes}`;

        Kango.sendMessage(m.chat, { image: { url: data.Poster }, caption: imdbText }, { quoted: m });
      } catch (error) {
        reply("❌ Unable to fetch IMDb data.");
      }
    }
  },
{
  command: ['lyrics'],
  operate: async ({ m, text, Kango, reply }) => {
    if (!text) return reply("Provide a song name.");
    
    try {
      const apiUrl = `https://xploader-api.vercel.app/lyrics?query=${encodeURIComponent(text)}`;
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (!result.length || !result[0].song || !result[0].artist || !result[0].lyrics) throw new Error();

      Kango.sendMessage(m.chat, {
        text: `🎵 *Lyrics for:* ${result[0].song} - ${result[0].artist}\n\n${result[0].lyrics}`
      }, { quoted: m });
    } catch (error) {
      console.error('❌ Unable to fetch lyrics:', error);
      reply("❌ Unable to fetch lyrics.");
    }
  }
}, {
  command: ["sticker-search"],
  operate: async ({ Kango: David, m, reply, text }) => {
    if (!text) return reply('Enter the theme!');

    try {
      const response = await fetch('https://endpoint.web.id/search/sticker?key=gojou&query=' + encodeURIComponent(text));
      const tick = await response.json();

      if (tick.status) {
        const result = tick.result;
        let responseMessage = `*Title:* ${result.title}\n*Author:* ${result.author}\n*Author Link:* ${result.author_link}\n\n*Stickers:*\n`;

        result.sticker.forEach((stickerUrl, index) => {
          responseMessage += `Sticker ${index + 1}: ${stickerUrl}\n`;
        });

        reply(responseMessage);
      } else {
        reply('No results found.');
      }
    } catch (error) {
      console.error("Error fetching sticker search results:", error);
      reply('There was an error!');
    }
  }
}, {
    command: ['weather'],
    operate: async ({ Kango, m, reply, text }) => {
      if (!text) return reply("Provide a location.");

      try {
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`);
        
        const weatherInfo = `🌤️ *Weather for ${text}*\n\n`
          + `🌡️ *Temperature:* ${data.main.temp}°C (Feels like ${data.main.feels_like}°C)\n`
          + `🌪️ *Weather:* ${data.weather[0].main} - ${data.weather[0].description}\n`
          + `💨 *Wind Speed:* ${data.wind.speed} m/s\n`
          + `📍 *Coordinates:* ${data.coord.lat}, ${data.coord.lon}\n`
          + `🌍 *Country:* ${data.sys.country}`;

        Kango.sendMessage(m.chat, { text: weatherInfo }, { quoted: m });
      } catch (error) {
        reply("❌ Unable to fetch weather data.");
      }
    }
  }, {
    command: ['yts', 'ytsearch'],
    operate: async ({ Kango, m, reply, text, prefix, command }) => {
      if (!text) return reply(`📌 *Example: ${prefix + command} Eminem Godzilla*`);

      try {
        const searchResults = await yts(text);
        if (!searchResults.all.length) return reply("❌ *No YouTube results found.*");

        let responseText = `🎥 *YouTube Search Results for:* ${text}\n\n`;
        searchResults.all.slice(0, 10).forEach((video, index) => {
          responseText += `□ *${index + 1}.* ${video.title}\n□ *Uploaded:* ${video.ago}\n□ *Views:* ${video.views}\n□ *Duration:* ${video.timestamp}\n□ *URL:* ${video.url}\n\n─────────────────\n\n`;
        });

        await Kango.sendMessage(
          m.chat,
          { image: { url: searchResults.all[0].thumbnail }, caption: responseText },
          { quoted: m }
        );
      } catch (error) {
        console.error("YT Search command failed:", error);
        reply("❌ *An error occurred while fetching YouTube search results.*");
      }
    }
  }
];