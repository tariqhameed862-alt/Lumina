/* Drives the narrative beats: which chapter intro/outro (if any) is due, and bookkeeping
   for "already seen". Pure logic — no DOM. js/ui/StoryOverlay.js renders what this hands it. */
import { STORY } from './content.js';

export class Story {
  constructor(storage, levels, chapters) {
    this.storage = storage;
    this.levels = levels;
    this.chapters = chapters;
    this._backfillLegacy();
  }

  /** Players upgrading from a save written before the story existed shouldn't get
   *  lore for chapters they already lived through dumped on them retroactively —
   *  mark any chapter with existing progress as "already seen". */
  _backfillLegacy() {
    if (!this.storage.upgradedFromLegacyStory) return;
    for (const ch of this.chapters) {
      const beats = STORY[ch.id];
      if (!beats) continue;
      const started = this.levels.some(l => l.chapterId === ch.id && this.storage.isCompleted(l.index));
      if (started) {
        this.storage.markStorySeen(beats.intro.id);
        this.storage.markStorySeen(beats.outro.id);
      }
    }
  }

  isChapterComplete(chapterId) {
    return this.levels.filter(l => l.chapterId === chapterId).every(l => this.storage.isCompleted(l.index));
  }

  /** The chapter-opening beat, if `level` is its chapter's first level and it hasn't played yet. */
  pendingIntro(level) {
    if (level.indexInChapter !== 0) return null;
    const beats = STORY[level.chapterId];
    if (!beats || this.storage.hasSeenStory(beats.intro.id)) return null;
    return beats.intro;
  }

  /** The chapter-closing beat, if this win just completed `level`'s chapter. */
  pendingOutro(level, chapterJustCompleted) {
    if (!chapterJustCompleted) return null;
    const beats = STORY[level.chapterId];
    if (!beats || this.storage.hasSeenStory(beats.outro.id)) return null;
    return beats.outro;
  }

  /** Fallback for when the player leaves the victory screen without hitting "Next"
   *  (Levels / Replay / back-out): the first earned-but-unseen chapter outro, so it
   *  isn't lost — surfaced on the next visit to a hub screen (menu / level select). */
  pendingOutroAnywhere() {
    for (const ch of this.chapters) {
      const beats = STORY[ch.id];
      if (beats && this.isChapterComplete(ch.id) && !this.storage.hasSeenStory(beats.outro.id)) return beats.outro;
    }
    return null;
  }

  markSeen(beat) { this.storage.markStorySeen(beat.id); }
}
