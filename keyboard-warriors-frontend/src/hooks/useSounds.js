// Path: frontend/src/hooks/useSounds.js

import * as Tone from "tone";

// Create synth instances once to avoid creating them on every sound play
const synth = new Tone.Synth().toDestination();
const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();

export const useSounds = () => {
  const playSuccess = () => {
    // By not specifying a time, we let Tone.js play the sound immediately
    polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "8n");
  };

  const playError = () => {
    // This prevents the "start time" error if called in rapid succession
    synth.triggerAttackRelease("C#2", "8n");
  };

  const playWinner = () => {
    // This is a sequence, so we still need explicit timing
    const now = Tone.now();
    polySynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "4n", now);
    polySynth.triggerAttackRelease(["G5", "B5", "D6", "G6"], "4n", now + 0.2);
  };

  const playClick = () => {
    synth.triggerAttackRelease("C7", "32n");
  };

  return { playSuccess, playError, playWinner, playClick };
};
