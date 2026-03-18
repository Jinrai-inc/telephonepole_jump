/**
 * アカウントロック機能
 * PCI DSS v4.0基準: 10回以下のログイン失敗でアカウントをロック
 */

interface LockEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number;
}

const lockStore = new Map<string, LockEntry>();

/** 最大失敗回数 */
const MAX_FAILED_ATTEMPTS = 10;

/** ロック時間: 30分 */
const LOCK_DURATION_MS = 30 * 60 * 1000;

/** 失敗回数のリセット時間: 1時間 */
const RESET_WINDOW_MS = 60 * 60 * 1000;

// 定期的に期限切れエントリを削除
setInterval(() => {
  const now = Date.now();
  lockStore.forEach((entry, key) => {
    if (now - entry.lastAttemptAt > RESET_WINDOW_MS && (!entry.lockedUntil || now > entry.lockedUntil)) {
      lockStore.delete(key);
    }
  });
}, 5 * 60_000);

/**
 * アカウントがロックされているか確認
 */
export function isAccountLocked(email: string): { locked: boolean; remainingMinutes: number } {
  const entry = lockStore.get(email.toLowerCase());
  if (!entry?.lockedUntil) return { locked: false, remainingMinutes: 0 };

  const now = Date.now();
  if (now > entry.lockedUntil) {
    // ロック期間終了 → リセット
    entry.lockedUntil = null;
    entry.failedAttempts = 0;
    return { locked: false, remainingMinutes: 0 };
  }

  const remainingMinutes = Math.ceil((entry.lockedUntil - now) / 60_000);
  return { locked: true, remainingMinutes };
}

/**
 * ログイン失敗を記録
 */
export function recordFailedAttempt(email: string): { locked: boolean; attemptsRemaining: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  let entry = lockStore.get(key);

  if (!entry || now - entry.lastAttemptAt > RESET_WINDOW_MS) {
    entry = { failedAttempts: 0, lockedUntil: null, lastAttemptAt: now };
    lockStore.set(key, entry);
  }

  entry.failedAttempts++;
  entry.lastAttemptAt = now;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
    return { locked: true, attemptsRemaining: 0 };
  }

  return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS - entry.failedAttempts };
}

/**
 * ログイン成功時に失敗回数をリセット
 */
export function resetFailedAttempts(email: string): void {
  lockStore.delete(email.toLowerCase());
}
