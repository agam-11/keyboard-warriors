// Path: frontend/src/hooks/useSounds.js

import * as Tone from "tone";

// Create synth instances once to avoid creating them on every sound play
const synth = new Tone.Synth().toDestination();
const polySynth = new Tone.PolySynth(Tone.Synth).toDestination();

export const useSounds = () => {
  const playSuccess = () => {
    // A quick, ascending arpeggio for a correct answer
    const now = Tone.now();
    polySynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "8n", now);
  };

  const playError = () => {
    // A low, dissonant buzz for an incorrect answer
    const now = Tone.now();
    synth.triggerAttackRelease("C#2", "8n", now);
  };

  const playWinner = () => {
    // A more elaborate, celebratory sequence for winning the game
    const now = Tone.now();
    polySynth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "4n", now);
    polySynth.triggerAttackRelease(["G5", "B5", "D6", "G6"], "4n", now + 0.2);
  };

  const playClick = () => {
    // A short, sharp click for UI interactions
    const now = Tone.now();
    synth.triggerAttackRelease("C7", "32n", now);
  };

  return { playSuccess, playError, playWinner, playClick };
};
