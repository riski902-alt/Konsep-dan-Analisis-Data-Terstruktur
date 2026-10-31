import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { RaceEngine } from './src/engine/raceEngine.ts';
import type { TeamId } from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverRaceEngine = new RaceEngine();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/topics', (_req, res) => {
    res.json(serverRaceEngine.getTopicsInfo());
  });

  app.post('/api/race/start', (req, res) => {
    const rawTopicFilter = Number(req.body?.topicFilter ?? 0);
    const lamaccaPlayer = String(req.body?.lamaccaPlayer ?? '');
    const toaccaPlayer = String(req.body?.toaccaPlayer ?? '');

    const result = serverRaceEngine.startRace(rawTopicFilter, lamaccaPlayer, toaccaPlayer);
    res.json(result);
  });

  app.post('/api/race/mark-go', (req, res) => {
    const sessionId = String(req.body?.sessionId ?? '');
    const updated = serverRaceEngine.markGo(sessionId);
    if (!updated) {
      res.status(404).json({ error: 'Sesi balapan tidak ditemukan.' });
      return;
    }
    res.json({ session: updated });
  });

  app.post('/api/race/answer', (req, res) => {
    const sessionId = String(req.body?.sessionId ?? '');
    const team = String(req.body?.team ?? '') as TeamId;
    const questionId = String(req.body?.questionId ?? '');
    const answer = req.body?.answer;

    if (team !== 'lamacca' && team !== 'toacca') {
      res.status(400).json({ error: 'Identitas tim tidak valid.' });
      return;
    }

    const result = serverRaceEngine.submitAnswer(sessionId, team, questionId, answer);
    if (!result) {
      res.status(404).json({ error: 'Sesi balapan tidak ditemukan.' });
      return;
    }

    res.json(result);
  });

  app.post('/api/race/conclude', (req, res) => {
    const sessionId = String(req.body?.sessionId ?? '');
    const updated = serverRaceEngine.concludeRace(sessionId);
    if (!updated) {
      res.status(404).json({ error: 'Sesi balapan tidak ditemukan.' });
      return;
    }
    res.json({ session: updated });
  });

  app.get('/api/race/leaderboard', (_req, res) => {
    res.json({ leaderboard: serverRaceEngine.getLeaderboard() });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LAMACCA VS TOACCA Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
