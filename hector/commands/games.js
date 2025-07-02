// kango/commands/tictactoe.js

const tttGames = {}; // { [chatId]: gameState }

const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function renderBoard(board) {
  const symbols = { X: '❌', O: '⭕', null: '⬜' };
  let out = '';
  for (let i = 0; i < 9; i++) {
    out += symbols[board[i]];
    if ((i+1)%3===0) out += '\n';
  }
  return out;
}

function checkWin(board) {
  for (const [a, b, c] of WIN_COMBOS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board) {
  return board.every(cell => cell !== null);
}

module.exports = [{
  command: ['tictactoe', 'ttt'],
  tags: ['game'],
  help: [
    'tictactoe @user',
    'tictactoe (as reply to opponent)',
    'tictactoe move <1-9>',
    'tictactoe end',
    'tictactoe restart'
  ],
  operate: async ({ m, args, reply }) => {
    const chatId = m.chat;
    const sender = m.sender;
    const isGroup = m.isGroup || m.chat.endsWith('@g.us');
    const mention = m.mentionedJid && m.mentionedJid[0];
    const replyJid = m.quoted && m.quoted.sender;

    // Determine opponent (works in both group and private)
    let opponent = null;
    if (mention && mention !== sender) {
      opponent = mention;
    } else if (replyJid && replyJid !== sender) {
      opponent = replyJid;
    }

    // END GAME
    if (args[0] === "end") {
      if (tttGames[chatId]) {
        delete tttGames[chatId];
        return reply("Game ended.");
      } else {
        return reply("No game to end.");
      }
    }

    // RESTART GAME
    if (args[0] === "restart") {
      const prev = tttGames[chatId];
      if (!prev || !prev.players) return reply("No previous game found to restart. Start a new game with .tictactoe @user or by reply.");
      // Swap who starts
      const newPlayers = [prev.players.O, prev.players.X];
      tttGames[chatId] = {
        board: Array(9).fill(null),
        players: { X: newPlayers[0], O: newPlayers[1] },
        currentPlayer: 'X',
        isActive: true
      };
      return reply(
        `Game restarted!\n❌: @${newPlayers[0].split('@')[0]}\n⭕: @${newPlayers[1].split('@')[0]}\n\n${renderBoard(tttGames[chatId].board)}\n❌ starts! Use .tictactoe move <1-9>`
      );
    }

    // MAKE A MOVE
    if (args[0] === "move") {
      const pos = parseInt(args[1], 10) - 1;
      const game = tttGames[chatId];
      if (!game || !game.isActive) return reply("No active game.");
      if (isNaN(pos) || pos < 0 || pos > 8) return reply("Invalid move. Use 1-9.");
      if (game.board[pos]) return reply("Position already taken.");
      if (game.players[game.currentPlayer] !== sender) return reply("Not your turn!");

      game.board[pos] = game.currentPlayer;

      // Win?
      const winner = checkWin(game.board);
      if (winner) {
        game.isActive = false;
        reply(`🎉 Player ${winner === 'X' ? '❌' : '⭕'} (@${game.players[winner].split('@')[0]}) wins!\n${renderBoard(game.board)}`);
        delete tttGames[chatId];
        return;
      }
      // Draw?
      if (isDraw(game.board)) {
        game.isActive = false;
        reply(`🤝 It's a draw!\n${renderBoard(game.board)}`);
        delete tttGames[chatId];
        return;
      }
      // Next turn
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      reply(`Move accepted.\n${renderBoard(game.board)}\nNext: @${game.players[game.currentPlayer].split('@')[0]}`);
      return;
    }

    // START NEW GAME
    if (!opponent) {
      return reply("Please tag your opponent or reply to their message to start a game.\nExample: .tictactoe @user or reply to a message with .tictactoe");
    }
    if (tttGames[chatId] && tttGames[chatId].isActive) {
      return reply("A game is already active in this chat. Use .tictactoe end to stop it.");
    }
    // Randomly assign X/O
    const players = Math.random() < 0.5 ? [sender, opponent] : [opponent, sender];
    tttGames[chatId] = {
      board: Array(9).fill(null),
      players: { X: players[0], O: players[1] },
      currentPlayer: 'X',
      isActive: true
    };
    return reply(
      `Tic-Tac-Toe Game Started!\n❌: @${players[0].split('@')[0]}\n⭕: @${players[1].split('@')[0]}\n\n${renderBoard(tttGames[chatId].board)}\n❌ starts! Use .tictactoe move <1-9>`
    );
  }
}];
