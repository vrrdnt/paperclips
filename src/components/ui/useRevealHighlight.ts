import { useCallback, useEffect, useState } from 'react';

const seenRevealKeys = new Set<string>();
const pendingRevealKeys = new Set<string>();

let initialRevealWindowOpen = true;
let initialRevealTimerStarted = false;

function closeInitialRevealWindowSoon() {
  if (initialRevealTimerStarted) return;
  initialRevealTimerStarted = true;

  if (typeof window === 'undefined') {
    initialRevealWindowOpen = false;
    return;
  }

  window.setTimeout(() => {
    initialRevealWindowOpen = false;
  }, 0);
}

export function useRevealHighlight(revealKey: string) {
  const [isHighlighted, setIsHighlighted] = useState(() => pendingRevealKeys.has(revealKey));

  useEffect(() => {
    closeInitialRevealWindowSoon();

    if (pendingRevealKeys.has(revealKey)) {
      setIsHighlighted(true);
      return;
    }

    if (seenRevealKeys.has(revealKey)) {
      setIsHighlighted(false);
      return;
    }

    seenRevealKeys.add(revealKey);
    if (initialRevealWindowOpen) {
      setIsHighlighted(false);
      return;
    }

    pendingRevealKeys.add(revealKey);
    setIsHighlighted(true);
  }, [revealKey]);

  const acknowledgeReveal = useCallback(() => {
    if (!pendingRevealKeys.delete(revealKey)) return;
    setIsHighlighted(false);
  }, [revealKey]);

  return { isHighlighted, acknowledgeReveal };
}
