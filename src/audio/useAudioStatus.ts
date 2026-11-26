import { useSyncExternalStore } from 'react';
import { audio, type EngineStatus } from './engine';

export function useAudioStatus(): EngineStatus {
  return useSyncExternalStore(
    (onChange) => audio.subscribe(onChange),
    () => audio.status,
  );
}
