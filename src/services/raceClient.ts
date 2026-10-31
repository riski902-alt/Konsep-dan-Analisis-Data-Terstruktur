import { RaceEngine, type TopicOptionItem } from '../engine/raceEngine.ts';
import type {
  LeaderboardEntry,
  RaceSessionState,
  StartRaceResponse,
  SubmitAnswerResponse,
  TeamId,
} from '../types/game.ts';

const LEADERBOARD_STORAGE_KEY = 'lamacca_toacca_leaderboard_v1';

function loadStoredLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function saveStoredLeaderboard(entries: LeaderboardEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries.slice(0, 25)));
  } catch {
    // ignore storage quota errors
  }
}

const localEngine = new RaceEngine(loadStoredLeaderboard(), saveStoredLeaderboard);

function isKnownStaticEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const proto = window.location.protocol;
  return (
    proto === 'file:' ||
    host.endsWith('.github.io') ||
    host.endsWith('.pages.dev') ||
    host.endsWith('.netlify.app') ||
    host.endsWith('.vercel.app')
  );
}

class HybridRaceClient {
  private useLocalOnly: boolean = isKnownStaticEnvironment();
  private activeLocalSessionIds = new Set<string>();

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
    if (this.useLocalOnly) return null;
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init?.headers ?? {}),
        },
      });
      if (!res.ok) {
        this.useLocalOnly = true;
        return null;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Static hosts often return index.html (text/html) for unknown paths
        this.useLocalOnly = true;
        return null;
      }
      return (await res.json()) as T;
    } catch {
      this.useLocalOnly = true;
      return null;
    }
  }

  public async getInitialData(): Promise<{
    topics: TopicOptionItem[];
    leaderboard: LeaderboardEntry[];
  }> {
    if (!this.useLocalOnly) {
      const [tpData, lbData] = await Promise.all([
        this.fetchJson<{ topics: TopicOptionItem[] }>('/api/topics'),
        this.fetchJson<{ leaderboard: LeaderboardEntry[] }>('/api/race/leaderboard'),
      ]);

      if (tpData?.topics && lbData?.leaderboard) {
        return {
          topics: tpData.topics,
          leaderboard: lbData.leaderboard,
        };
      }
    }

    return {
      topics: localEngine.getTopicsInfo().topics,
      leaderboard: localEngine.getLeaderboard(),
    };
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.useLocalOnly) {
      const lbData = await this.fetchJson<{ leaderboard: LeaderboardEntry[] }>(
        '/api/race/leaderboard',
      );
      if (lbData?.leaderboard) {
        return lbData.leaderboard;
      }
    }
    return localEngine.getLeaderboard();
  }

  public async startRace(
    topicFilter: number,
    lamaccaPlayer: string,
    toaccaPlayer: string,
  ): Promise<StartRaceResponse> {
    if (!this.useLocalOnly) {
      const serverData = await this.fetchJson<StartRaceResponse>('/api/race/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicFilter, lamaccaPlayer, toaccaPlayer }),
      });
      if (serverData?.session && Array.isArray(serverData.questions)) {
        return serverData;
      }
    }

    const localData = localEngine.startRace(topicFilter, lamaccaPlayer, toaccaPlayer);
    this.activeLocalSessionIds.add(localData.session.sessionId);
    return localData;
  }

  public async markGo(sessionId: string): Promise<RaceSessionState | null> {
    if (!this.useLocalOnly && !this.activeLocalSessionIds.has(sessionId)) {
      const serverData = await this.fetchJson<{ session: RaceSessionState }>(
        '/api/race/mark-go',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        },
      );
      if (serverData?.session) {
        return serverData.session;
      }
    }
    return localEngine.markGo(sessionId);
  }

  public async submitAnswer(
    sessionId: string,
    team: TeamId,
    questionId: string,
    answer: unknown,
  ): Promise<SubmitAnswerResponse | null> {
    if (!this.useLocalOnly && !this.activeLocalSessionIds.has(sessionId)) {
      const serverData = await this.fetchJson<SubmitAnswerResponse>('/api/race/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, team, questionId, answer }),
      });
      if (serverData?.session && serverData.teamResult) {
        return serverData;
      }
    }
    return localEngine.submitAnswer(sessionId, team, questionId, answer);
  }

  public async concludeRace(sessionId: string): Promise<RaceSessionState | null> {
    if (!this.useLocalOnly && !this.activeLocalSessionIds.has(sessionId)) {
      const serverData = await this.fetchJson<{ session: RaceSessionState }>(
        '/api/race/conclude',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        },
      );
      if (serverData?.session) {
        return serverData.session;
      }
    }
    return localEngine.concludeRace(sessionId);
  }
}

export const raceClient = new HybridRaceClient();
