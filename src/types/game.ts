export type TeamId = 'lamacca' | 'toacca';

export type QuestionType = 'PG' | 'PGK' | 'MENJODOHKAN' | 'ISIAN';

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  label: string;
}

export interface MatchingChoice {
  id: string;
  keyLabel: string;
  text: string;
}

export interface PublicQuestion {
  id: string;
  globalOrder: number;
  topicIndex: number;
  topicTitle: string;
  categoryTitle: string;
  categoryNote?: string;
  numberInTopic: number;
  type: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  matchingChoices?: MatchingChoice[];
  pgkRequiredCount?: number;
}

export interface TeamAnswerFeedback {
  questionId: string;
  questionNumber: number;
  isCorrect: boolean;
  submittedValue: string;
  message: string;
  validatedAtMs: number;
  elapsedFromQuestionOpenMs: number;
}

export interface TeamRaceState {
  id: TeamId;
  teamName: string;
  playerName: string;
  currentIndex: number; // Independent 0-based question index per team!
  questionOpenedAtMs: number;
  completedAllQuestions: boolean;
  steps: number;
  correctCount: number;
  wrongCount: number;
  lastFeedback: TeamAnswerFeedback | null;
  finishedAtMs: number | null;
  completedQuestionsAtMs: number | null;
  cumulativeCorrectTimeMs: number;
}

export type RaceStatus = 'preparing' | 'countdown' | 'racing' | 'finished';

export type WinnerResult = 'lamacca' | 'toacca' | 'draw' | null;

export interface RaceSessionState {
  sessionId: string;
  topicFilter: number;
  modeLabel: string;
  status: RaceStatus;
  totalQuestions: number;
  totalSteps: number;
  raceStartedAtMs: number;
  raceFinishedAtMs: number | null;
  winner: WinnerResult;
  winReason: string | null;
  lamacca: TeamRaceState;
  toacca: TeamRaceState;
}

export interface StartRaceResponse {
  session: RaceSessionState;
  questions: PublicQuestion[];
}

export interface SubmitAnswerResponse {
  session: RaceSessionState;
  teamResult: TeamAnswerFeedback;
}

export interface LeaderboardEntry {
  id: string;
  finishedAtIso: string;
  modeLabel: string;
  winner: WinnerResult;
  lamaccaPlayer: string;
  toaccaPlayer: string;
  lamaccaSteps: number;
  toaccaSteps: number;
  totalSteps: number;
  durationSeconds: number;
}

export type CameraMode =
  | 'chase'
  | 'side'
  | 'track'
  | 'cinematic_start'
  | 'cinematic_finish';

export interface AudioSettings {
  muted: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  engineVolume: number;
  sfxVolume: number;
}
