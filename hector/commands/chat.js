const fetch = require('node-fetch');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const path = require('path');
const aiartGenerator = require('../../kango/aiart');

const SESSION_FILE = path.join(__dirname, '../../src/gemini.json');

const loadSession = () => {
    if (!fs.existsSync(SESSION_FILE)) {
        fs.writeFileSync(SESSION_FILE, JSON.stringify({}), 'utf-8')
    }
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
};
const saveSession = (data) => {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
};

module.exports = [{
  command: ["perplexity"],
  operate: async ({
    Kango,
    m,
    reply,
    text
  }) => {
    // React when processing
    await Kango.sendMessage(m.chat, {
      react: {
        text: "🤖",
        key: m.key
      }
    });

    if (!text) {
      await Kango.sendMessage(m.chat, {
        react: {
          text: "❌",
          key: m.key
        }
      });
      return reply("*Ask me anything! I'll search for the most accurate answer using Perplexity AI*");
    }
    
    try {
      const apiUrl = `https://aimodels.officialhectormanuel.workers.dev/ask?prompt=${encodeURIComponent(text)}&model=Perplexity AI`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.success && response.data.response) {
        await Kango.sendMessage(m.chat, {
          react: {
            text: "✅",
            key: m.key
          }
        });
        reply(response.data.response);
      } else {
        await Kango.sendMessage(m.chat, {
          react: {
            text: "❓",
            key: m.key
          }
        });
        reply("*No response received from Perplexity AI*");
      }
    } catch (error) {
      console.error("Error fetching response from Perplexity API:", error);
      await Kango.sendMessage(m.chat, {
        react: {
          text: "❌",
          key: m.key
        }
      });
      reply("*An error occurred while fetching the response from Perplexity AI*");
    }
  }
}, {
  command: ["gemini"],
  operate: async ({ Kango, m, reply, text }) => {

    await Kango.sendMessage(m.chat, { react: { text: "🤖", key: m.key } });

    if (!text) {
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return reply("*Alright, what's on your mind? 🥰*");
    }

    try {
      const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(text)}&model=gemini`;
      const response = await axios.get(apiUrl);

      const aiMessage = response.data?.message?.content;

      if (aiMessage) {
        await Kango.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        return reply(aiMessage);
      } else {
        await Kango.sendMessage(m.chat, { react: { text: "❓", key: m.key } });
        return reply("*No response from Gemini AI*");
      }

    } catch (e) {
      console.error("Gemini API Error:", e);
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply("*Gemini AI error occurred*");
    }
  }
}, {
  command: ["generate"],
  operate: async ({
    Kango: _0x412c91,
    m: _0x18b8a6,
    reply: _0x334518,
    text: _0x230dc3,
    prefix: _0x6fd4b9,
    command: _0x3ee3c6
  }) => {
    if (!_0x230dc3) {
      return _0x334518("*Please provide a query to generate an image!*");
    }
    const _0x3793fd = "https://api.gurusensei.workers.dev/dream?prompt=" + encodeURIComponent(_0x230dc3);
    try {
      await _0x412c91.sendMessage(_0x18b8a6.chat, {
        image: {
          url: _0x3793fd
        }
      }, {
        quoted: _0x18b8a6
      });
    } catch (_0xc10ce6) {
      console.error("Error generating image:", _0xc10ce6);
      _0x334518("*An error occurred while generating the image.*");
    }
  }
}, {
  command: ["aiart", "create", "artwork"],
  operate: async ({
    Kango,
    m,
    reply,
    text
  }) => {
    // React when processing starts
    await Kango.sendMessage(m.chat, {
      react: {
        text: "🎨",
        key: m.key
      }
    });

    if (!text) {
      await Kango.sendMessage(m.chat, {
        react: {
          text: "❌",
          key: m.key
        }
      });
      return reply(`🎨 *AI Image Generator*\n━━━━━━━━━━━━━━━━\n\n*Create amazing images with AI!*\n\n*Usage:* .aiart <your prompt>\n\n*Examples:*\n• .aiart a beautiful sunset\n• .aiart cyberpunk city at night\n• .aiart fantasy castle in the mountains\n• .aiart cute anime character\n\n> Powered By Hector`);
    }

    try {
      // Send processing message
      const processingMsg = await reply(`🎨 *AI Image Generation*\n━━━━━━━━━━━━━━━━\n\n📝 *Prompt:* ${text}\n\n⚡ *Status:* Initializing AI artist...\n⏱️ *ETA:* 1-2 minutes\n\n🖌️ Creating your masterpiece...\n\n> *Powered By Hector*`);
      
      // Generate the image
      const result = await aiartGenerator.generateImage(text);
      
      if (result.success && result.images && result.images.length > 0) {
        // Send the generated image
        await Kango.sendMessage(m.chat, {
          image: { url: result.images[0] },
          caption: `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${text}\n\n✅ Successfully created!\n\n> *Powered By Hector*`
        }, { quoted: m });

        // Success reaction
        await Kango.sendMessage(m.chat, {
          react: {
            text: "✅",
            key: m.key
          }
        });

        // Delete processing message
        if (processingMsg) {
          await Kango.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: true,
              id: processingMsg.key.id
            }
          });
        }

      } else {
        await Kango.sendMessage(m.chat, {
          react: {
            text: "❌",
            key: m.key
          }
        });
        reply(`❌ *Generation Failed*\n\nError: ${result.error || "Unknown error"}\n\nPlease try again with a different prompt.\n\n*Powered By Hector*`);
      }

    } catch (error) {
      console.error("Error in aiart command:", error);
      await Kango.sendMessage(m.chat, {
        react: {
          text: "❌",
          key: m.key
        }
      });
      reply(`❌ *AI Art Failed*\n\nError: ${error.message}\n\nPlease try again later.\n\n*Powered By Hector*`);
    }
  }
}, {
  command: ["chatgpt"],
  operate: async ({
    m: _0x32242b, // unused in this example
    reply: _0x39feca, // function to send the reply
    text: _0x3d3d07  // user's question
  }) => {
    if (!_0x3d3d07) {
      return _0x39feca("*Spill the tea! ☕ What burning question do you have?*");
    }

    const apiKey = "08da4ef3bedbb2a90a"; // Your API key
    const apiUrl = `https://api.nexoracle.com/ai/chatgpt?apikey=${apiKey}&prompt=${encodeURIComponent(_0x3d3d07)}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json(); // Attempt to get error details
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        return _0x39feca(`*An error occurred: ${errorMessage}*`);
      }

      const data = await response.json();

      if (data.status !== 200) {
        return _0x39feca(`*API error: ${data.status} - ${data.message || "Unknown error"}*`);
      }

      //Handle different response structures.  NexOracle's response seems inconsistent based on your example.
      const result = data.result || data.message || "No response from API"; //Fallback if result is missing

      _0x39feca(result);

    } catch (error) {
      console.error("Error fetching response from ChatGPT API:", error);
      _0x39feca("*An error occurred while fetching the response from ChatGPT API.*");
    }
  }
}, {
  command: ["matrix"],
  operate: async ({
    Kango: _0x56a354, // Assuming 'Kango' is the object used for sending messages
    m: _0x32242b, // unused in the original, but kept for consistency
    reply: _0x39feca, // function to send the reply
    text: _0x3d3d07  // user's question
  }) => {
    // React with a green code emoji when command is received
    await _0x56a354.sendMessage(_0x32242b.chat, {
      react: {
        text: "⏳", // Or another matrix-related emoji if you prefer
        key: _0x32242b.key
      }
    });

    if (!_0x3d3d07) {
      await _0x56a354.sendMessage(_0x32242b.chat, {
        react: {
          text: "❌",
          key: _0x32242b.key
        }
      });
      return _0x39feca("*My brain is tingling with anticipation! 🧠⚡ Ask me, ask me!*");
    }

    const apiKey = "MatrixZatKing"; // Your API key
    const apiUrl = `https://api.nexoracle.com/ai/gemini?apikey=${apiKey}&prompt=${encodeURIComponent(_0x3d3d07)}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        await _0x56a354.sendMessage(_0x32242b.chat, {
          react: {
            text: "⚠️", // Using a warning emoji for API errors
            key: _0x32242b.key
          }
        });
        const errorData = await response.json(); // Attempt to get error details
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        return _0x39feca(`*An error occurred: ${errorMessage}*`);
      }

      const data = await response.json();

      if (data.status !== 200) {
        await _0x56a354.sendMessage(_0x32242b.chat, {
          react: {
            text: "⚠️", // Using a warning emoji for API errors
            key: _0x32242b.key
          }
        });
        return _0x39feca(`*API error: ${data.status} - ${data.message || "Unknown error"}*`);
      }

      //Handle different response structures.  NexOracle's response seems inconsistent based on your example.
      const result = data.result || data.message || "No response from API"; //Fallback if result is missing

      await _0x56a354.sendMessage(_0x32242b.chat, {
        react: {
          text: "✅", // React with a success emoji after getting the response
          key: _0x32242b.key
        }
      });
      _0x39feca(result);

    } catch (error) {
      console.error("Error fetching response from matrix API:", error);
      await _0x56a354.sendMessage(_0x32242b.chat, {
        react: {
          text: "❌", // React with an error emoji on catch
          key: _0x32242b.key
        }
      });
      _0x39feca("*An error occurred while fetching the response from gemini API.*");
    }
  }
}, {
  command: ["suno", "musicai", "songai"],
  operate: async ({
    Kango,
    m,
    reply,
    text
  }) => {
    // React when processing starts
    await Kango.sendMessage(m.chat, {
      react: {
        text: "🎵",
        key: m.key
      }
    });

    if (!text) {
      await Kango.sendMessage(m.chat, {
        react: {
          text: "❌",
          key: m.key
        }
      });
      return reply(`🎵 *AI Music Generator*\n━━━━━━━━━━━━━━━━\n\n*Create amazing music with AI!*\n\n*Usage:* .suno <song description>\n\n*Examples:*\n• .suno Romantic love song about sunset\n• .suno Happy birthday jazz vibes\n• .suno Upbeat pop dance track\n• .suno Sad piano ballad about lost love\n\n> *Powered By Hector*`);
    }

    try {
      // Send processing message
      const processingMsg = await reply(`🎼 *AI Music Studio*\n━━━━━━━━━━━━━━━━\n\n🎤 *Prompt:* ${text}\n\n⚡ *Status:* Initializing AI composer...\n⏱️ *ETA:* 2-3 minutes\n\n🎹 Composing melody...\n🎤 Generating vocals...\n🎧 Mixing audio...\n\n> *Powered By Hector*`);

      // Generate the song
      const result = await sunoGenerator.generateSong(text);
      
      if (result.success && result.audioUrl) {
        // Get thumbnail for the audio
        const thumbnail = await sunoGenerator.getDefaultThumbnail();
        
        // Send the audio file
        await Kango.sendMessage(m.chat, {
          audio: { url: result.audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${sunoGenerator.cleanFilename(result.songTitle)}.mp3`,
          ...(thumbnail && { 
            contextInfo: {
              externalAdReply: {
                title: `🎵 ${result.songTitle}`,
                body: `AI Generated • ${text.substring(0, 40)}...`,
                mediaType: 2,
                thumbnail: thumbnail,
                mediaUrl: result.audioUrl,
                sourceUrl: result.audioUrl
              }
            }
          })
        }, { quoted: m });

        // Success reaction
        await Kango.sendMessage(m.chat, {
          react: {
            text: "✅",
            key: m.key
          }
        });

        // Delete processing message
        if (processingMsg) {
          await Kango.sendMessage(m.chat, {
            delete: {
              remoteJid: m.chat,
              fromMe: true,
              id: processingMsg.key.id
            }
          });
        }

      } else {
        await Kango.sendMessage(m.chat, {
          react: {
            text: "❌",
            key: m.key
          }
        });
        reply(`❌ *Song Generation Failed*\n\nError: ${result.error || "Unknown error"}\n\nPlease try again with a different prompt.\n\n> *Powered By Hector*`);
      }

    } catch (error) {
      console.error("Error in suno command:", error);
      await Kango.sendMessage(m.chat, {
        react: {
          text: "❌",
          key: m.key
        }
      });
      reply(`❌ *Music Generation Failed*\n\nError: ${error.message}\n\nPlease try again later.\n\n> *Powered By Hector*`);
    }
  }
},{
  command: ["deepseek", "deepseekllm"],
  operate: async ({ Kango, m, reply, text }) => {

    await Kango.sendMessage(m.chat, { react: { text: "🤖", key: m.key } });

    if (!text) {
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return reply("*Please ask a question for DeepSeek AI!*");
    }

    try {
      const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(text)}&model=deepseek`;
      const response = await axios.get(apiUrl);

      const aiMessage = response.data?.message?.content;

      if (aiMessage) {
        await Kango.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        return reply(aiMessage);
      } else {
        await Kango.sendMessage(m.chat, { react: { text: "❓", key: m.key } });
        return reply("*No response received from DeepSeek AI*");
      }

    } catch (e) {
      console.error("DeepSeek API Error:", e);
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply("*An error occurred while contacting DeepSeek AI*");
    }
  }
}, {
  command: ["doppleai"],
  operate: async ({
    reply: _0x2f2cc9,
    m: _0x384945,
    text: _0x3127e9
  }) => {
    async function _0x54d791(_0x7891cd) {
      const _0x2551e1 = await axios.get("https://xploader-api.vercel.app/doppleai?prompt=" + encodeURIComponent(_0x7891cd));
      return _0x2551e1.data;
    }
    try {
      if (!_0x3127e9) {
        return _0x2f2cc9("*Please ask a question*");
      }
      const _0x1b33f6 = await _0x54d791(_0x3127e9);
      _0x2f2cc9(_0x1b33f6.response);
    } catch (_0x4da6f7) {
      console.error("Error in DoppleAI plugin:", _0x4da6f7);
      _0x2f2cc9("An error occurred!");
    }
  }
}, {
  command: ["gpt", "gpt45", "gpt-4.5"],
  operate: async ({ Kango, m, reply, text }) => {

    await Kango.sendMessage(m.chat, { react: { text: "🤖", key: m.key } });

    if (!text) {
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return reply("*Unleash your inner Sherlock! 🕵️ What mystery should I solve?*");
    }

    try {
      const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(text)}&model=gpt-4.5`;
      const response = await axios.get(apiUrl);

      const aiMessage = response.data?.message?.content;

      if (aiMessage) {
        await Kango.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        return reply(aiMessage);
      } else {
        await Kango.sendMessage(m.chat, { react: { text: "❓", key: m.key } });
        return reply("*No response received from GPT-4.5*");
      }

    } catch (e) {
      console.error("GPT-4.5 API Error:", e);
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply("*GPT-4.5 error occurred*");
    }
  }
}, {
  command: ["imagen"],
  operate: async ({
    Kango: _0x2c23fe,
    m: _0x20b23a,
    reply: _0x53cc70,
    text: _0xb7156,
    prefix: _0x1ee080,
    command: _0x128c98
  }) => {
    if (!_0xb7156) {
      return _0x53cc70("*Please provide a query to generate an image!*");
    }
    const _0x576f78 = "https://bk9.fun/ai/magicstudio?prompt=" + encodeURIComponent(_0xb7156);
    try {
      await _0x2c23fe.sendMessage(_0x20b23a.chat, {
        image: {
          url: _0x576f78
        }
      }, {
        quoted: _0x20b23a
      });
    } catch (_0x480916) {
      console.error("Error generating image:", _0x480916);
      _0x53cc70("*An error occurred while generating the image.*");
    }
  }
}, {
  command: ["imagine"],
  operate: async ({
    Kango: _0x1e909c,
    m: _0x2e8bac,
    reply: _0x472a60,
    text: _0x7586b4,
    prefix: _0x5326ea,
    command: _0x4a70dc
  }) => {
    if (!_0x7586b4) {
      return _0x472a60("*Please provide a query to generate an image!*");
    }
    const _0x26add0 = "https://api.siputzx.my.id/api/ai/flux?prompt=" + encodeURIComponent(_0x7586b4);
    try {
      await _0x1e909c.sendMessage(_0x2e8bac.chat, {
        image: {
          url: _0x26add0
        }
      }, {
        quoted: _0x2e8bac
      });
    } catch (_0x1fbaab) {
      console.error("Error generating image:", _0x1fbaab);
      _0x472a60("An error occurred while generating the image.");
    }
  }
}, {
  command: ["mini", "gpt4omini"],
  operate: async ({ Kango, m, reply, text }) => {

    await Kango.sendMessage(m.chat, { react: { text: "🤖", key: m.key } });

    if (!text) {
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      return reply("*Ask something for GPT-4o-mini!*");
    }

    try {
      const apiUrl = `https://all-in-1-ais.officialhectormanuel.workers.dev/?query=${encodeURIComponent(text)}&model=gpt-4o-mini`;
      const response = await axios.get(apiUrl);

      const aiMessage = response.data?.message?.content;

      if (aiMessage) {
        await Kango.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        return reply(aiMessage);
      } else {
        await Kango.sendMessage(m.chat, { react: { text: "❓", key: m.key } });
        return reply("*No response from GPT-4o-mini*");
      }

    } catch (e) {
      console.error("GPT-4o-mini API Error:", e);
      await Kango.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
      reply("*Error contacting GPT-4o-mini*");
    }
  }
}, {
  command: ["llama"],
  operate: async ({
    m: _0x372c29,
    reply: _0x38911a,
    text: _0x3ba6b6
  }) => {
    if (!_0x3ba6b6) {
      return _0x38911a("*Please ask a question*");
    }
    try {
      let _0x4af9b3 = await fetch("https://bk9.fun/ai/llama?q=" + encodeURIComponent(_0x3ba6b6));
      let _0x18872e = await _0x4af9b3.json();
      if (!_0x18872e.BK9) {
        return _0x38911a("*Please try again later or try another command!*");
      } else {
        _0x38911a(_0x18872e.BK9);
      }
    } catch (_0x2aeff9) {
      console.error("Error fetching response from Llama API:", _0x2aeff9);
      _0x38911a("An error occurred while fetching the response from Llama API.");
    }
  }
}, {
  command: ["metaai"],
  operate: async ({
    m: _0x5544c5,
    reply: _0x320105,
    text: _0x67776b
  }) => {
    if (!_0x67776b) {
      return _0x320105("*Please ask a question*");
    }
    try {
      const _0x1eee67 = "https://api.siputzx.my.id/api/ai/meta-llama-33-70B-instruct-turbo?content=" + encodeURIComponent(_0x67776b);
      const _0x207375 = await fetch(_0x1eee67);
      const _0x3362c1 = await _0x207375.json();
      if (!_0x3362c1.status || !_0x3362c1.data) {
        return _0x320105("*Please try again later or try another command!*");
      } else {
        _0x320105(_0x3362c1.data);
      }
    } catch (_0x43904c) {
      console.error("Error fetching response from MetaAI API:", _0x43904c);
      _0x320105("An error occurred while fetching the response from MetaAI API.");
    }
  }
}, {
  command: ["mistral"],
  operate: async ({
    m: _0x5a9601,
    reply: _0x141b90,
    text: _0x2d4da5
  }) => {
    if (!_0x2d4da5) {
      return _0x141b90("*Please ask a question*");
    }
    try {
      const _0x4a8bbb = "https://api.siputzx.my.id/api/ai/mistral-7b-instruct-v0.2?content=" + encodeURIComponent(_0x2d4da5);
      const _0x4207d6 = await fetch(_0x4a8bbb);
      const _0x432306 = await _0x4207d6.json();
      if (!_0x432306.status || !_0x432306.data) {
        return _0x141b90("*Please try again later or try another command!*");
      } else {
        _0x141b90(_0x432306.data);
      }
    } catch (_0xabb096) {
      console.error("Error fetching response from Mistral API:", _0xabb096);
      _0x141b90("An error occurred while fetching the response from Mistral API.");
    }
  }
}, {
  command: ["photoai"],
  operate: async ({
    Kango: _0x5896a1,
    m: _0x504d7e,
    reply: _0x3268a8,
    text: _0x4c87c0,
    prefix: _0x26abc7,
    command: _0x110e2e
  }) => {
    if (!_0x4c87c0) {
      return _0x3268a8("*Please provide a query to generate an image!*");
    }
    const _0x58848b = "https://api.siputzx.my.id/api/ai/dreamshaper?prompt=" + encodeURIComponent(_0x4c87c0);
    try {
      await _0x5896a1.sendMessage(_0x504d7e.chat, {
        image: {
          url: _0x58848b
        }
      }, {
        quoted: _0x504d7e
      });
    } catch (_0x6782c5) {
      console.error("Error generating image:", _0x6782c5);
      _0x3268a8("An error occurred while generating the image.");
    }
  }
}];