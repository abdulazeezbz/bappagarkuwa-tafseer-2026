export type MiniControllerSnapshot = {
  hasActiveAudio: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  isPlayerUiVisible: boolean;
  bannerSource: number | null;
  onTogglePlayPause: (() => Promise<void> | void) | null;
  onOpenPlayerUi: (() => void) | null;
};

let snapshot: MiniControllerSnapshot = {
  hasActiveAudio: false,
  isPlaying: false,
  isBuffering: false,
  isPlayerUiVisible: false,
  bannerSource: null,
  onTogglePlayPause: null,
  onOpenPlayerUi: null,
};

const listeners = new Set<() => void>();

export function getMiniControllerSnapshot() {
  return snapshot;
}

export function subscribeMiniController(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMiniControllerSnapshot(next: MiniControllerSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}
