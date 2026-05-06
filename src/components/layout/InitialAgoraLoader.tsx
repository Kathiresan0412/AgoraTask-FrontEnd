'use client';

import { useEffect, useState } from 'react';
import { AgoraLoader } from '@/components/layout/AgoraLoader';

const MINIMUM_VISIBLE_MS = 900;

export function InitialAgoraLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsVisible(false);
    }, MINIMUM_VISIBLE_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!isVisible) {
    return null;
  }

  return <AgoraLoader />;
}
