/* Everything Iri can say, grouped by the moment that triggers it.
   Tone: wholesome, dramatic, slightly panicked little flame. To change her voice, edit ONLY this file.
   Each entry is [mood, text]. Moods drive her face: happy · panic · sleepy · proud · smug · sad */

const pool = (mood, ...texts) => texts.map((t) => [mood, t]);

export const LINES = {
  /* ---- Menu ---- */
  menuFresh: [
    ...pool('happy', "Oh! A Lightkeeper! Hi! I'm Iri. I'm a flame. Please don't blow.",
      'You came! I practiced my dramatic entrance and everything.',
      "Hello! I'm small, I'm warm, and I'm extremely on fire. Let's go!")
  ],
  menuBack: [
    ...pool('happy', 'You came back! I only flickered a little bit while you were gone.',
      "Welcome back! I saved your spot. And I did not sulk. Much.",
      'There you are! I was just narrating to the wall.')
  ],
  menuDone: [
    ...pool('proud', 'The whole Vale is lit and it is because of YOU. I told everyone.',
      'Back for more? Every Sanctuary is glowing. We are basically famous.')
  ],
  menuPoke: [
    ...pool('panic', "Hey! That's my face!", 'Stop poking the flame!', 'Ow! Hot! ...for you. For me it tickles.')
  ],

  /* ---- Level flow ---- */
  levelRepeat: [
    ...pool('smug', "Oh, we're doing this one again? Bold.", 'Round two! I already know the answer. Kidding. Mostly.',
      'Practice makes perfect. Or at least brighter.')
  ],
  restart: [
    ...pool('happy', "Fresh start! I'll pretend I didn't see any of that.", 'Clean slate! I love a clean slate. It reflects so nicely.',
      'Restarting! Deep breaths. I do not breathe. Still.')
  ],
  pause: [
    ...pool('sleepy', "Coffee break? I'll just... flicker here.", 'Pause! I need a moment. I am a very dramatic flame.',
      'Take your time. I am not going anywhere. I physically cannot.')
  ],
  resume: [
    ...pool('happy', 'Back already? I barely started missing you!', "And we're off!", 'Ready when you are!')
  ],

  /* ---- Idle nudges (escalate) ---- */
  idle1: [
    ...pool('happy', 'Take your time. I am a flame. Burning is all I do.',
      'Just thinking, huh? I love thinking. Very sparkly.',
      "No rush! (Slight rush. I'm cooling.)")
  ],
  idle2: [
    ...pool('sleepy', "Psst. Try turning something. Mirrors like being turned.",
      "If it helps: the answer is 'not the way you already tried'.",
      'I have started counting the grid dots. There are so many.')
  ],
  idle3: [
    ...pool('panic', "I'm not saying I'm going out... but I'm really flickering here.",
      'The crystals are asleep and honestly? Relatable.',
      "It is fine. Everything is fine. I'm just a tiny worried flame.")
  ],

  /* ---- Mirror handling ---- */
  undoOnce: [
    ...pool('smug', 'Undo! The universe forgives you.', 'Ctrl+Z on the universe. Bold.', 'Rewind! I love time travel.')
  ],
  undoMany: [
    ...pool('panic', 'Are we... undoing the whole level? Wow. Commitment issues.',
      'Undo, undo, undo. You are speedrunning regret.',
      "I'm getting whiplash and I don't even have a neck.")
  ],
  dizzy: [
    ...pool('panic', "Round and round we go! Wheeee— I'm getting dizzy from HERE.",
      'That mirror is spinning so fast it is going to take off!',
      'You can let go now. The mirror has learned its lesson.')
  ],
  overPar: [
    ...pool('smug', "Par is more of a... gentle suggestion. Don't worry about it.",
      "We're way over par. That's okay. Golf isn't even real.",
      'Everybody takes the scenic route sometimes!')
  ],

  /* ---- Beam reactions ---- */
  blocked: [
    ...pool('panic', 'OW. That is a WALL. That is a WALL.', 'Ahh, it is stone! Stone does not care about my feelings!',
      'I have hit the obsidian. I am fine. I am fine!')
  ],
  firstWake: [
    ...pool('happy', "Ooh! One's awake! It yawned! Did you see the yawn?", 'Look at it go! Somebody woke up on the right side of the crystal!')
  ],
  wakeMore: [
    ...pool('happy', 'Another one up! They are so cute when they are grumpy.', "And that one's awake! Hello, sleepyhead!",
      "It's like a very slow, very sparkly alarm clock.")
  ],
  lastOne: [
    ...pool('panic', 'Only one left!! Do not blink. I said DO NOT BLINK.', "One more! ONE MORE! I can't watch. I'm watching.",
      'So close! My heart is beating! (Flames have hearts. Look it up.)')
  ],
  lostOne: [
    ...pool('sad', 'Nooo, it fell back asleep!', 'It went back to bed. Rude!', 'Aaand it took a nap. Typical.')
  ],

  /* ---- Victory (shown inside the victory card, one per star count) ---- */
  win3: [
    ...pool('proud', 'Perfect. Show-off.', 'Three stars! I would clap but I am on fire.', 'Flawless. I am telling the whole Vale.')
  ],
  win2: [
    ...pool('happy', 'Two stars! Solid work. The crystals are impressed. One of them fainted (happily).', 'Nice! A tiny bit fancy, a tiny bit sloppy. My favorite combo.')
  ],
  win1: [
    ...pool('smug', "It counts! Technically! We don't have to tell anyone the move count.",
      'One star is still a star. Stars are stars. We win!', 'Look, the light got there eventually. That is what matters.')
  ],
  winFast: [
    ...pool('proud', 'Wait, that was quick. Are you cheating? Do you have a manual?', 'Speedy! I barely had time to be scared!')
  ],
  finale: [
    ...pool('proud', 'That is EVERY Sanctuary. I need to sit down. I have no legs.')
  ]
};

/** Rotating one-liners under the LUMINA title. */
export const TAGLINES = [
  'Now with 100% more sentient flame',
  'Please do not blow on the screen',
  'No crystals were harmed. Several were woken.',
  'Turn mirrors. Wake crystals. Repeat.',
  'Warning: contains dramatic fire',
  'Steady hands. Warm heart. Tiny flame.',
  'Best enjoyed with a cup of something warm'
];
