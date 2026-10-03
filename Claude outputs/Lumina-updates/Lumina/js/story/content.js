/* Story content: one narrator — Iri, the last burning mote of the First Light —
   guiding the player (the "Lightkeeper") through the Vale's three chapters.
   Keyed by CHAPTERS[i].id from js/levels/levels.js, so this stays data, not logic. */

export const STORY = {
  dawn: {
    intro: {
      id: 'dawn-intro',
      speaker: 'IRI',
      cta: 'Begin',
      pages: [
        'Before the Hush, one flame lit the whole Vale — dawn to dusk, without a single shadow. They called it the First Light.',
        'Then the quiet came. Not fire, not flood. Just… quiet. It settled over the Sanctuaries one by one, and the Vale went dark.',
        "The First Light shattered into a thousand motes when it fell. I'm the one that's still burning. And I think you can help me get home.",
        'The old mirrors still remember how to bend me — if your hand is steady. Turn them true, wake the Sanctuaries, and let’s see how far the light still reaches.'
      ]
    },
    outro: {
      id: 'dawn-outro',
      speaker: 'IRI',
      cta: 'Onward',
      pages: [
        "Listen — the valley's breathing again. Eight Sanctuaries, eight small suns. That's more light than the Hush has felt in a long time.",
        "But look east. Past the ridge, the mirrors don't shine anymore — they've gone to stone. Obsidian, cold clean through.",
        "That's old ground. The Monoliths used to keep watch over this whole Vale, before the Hush froze them mid-turn. Some of them, I don't think we can move at all.",
        "We don't need to beat the dark there. We just need to find the way around it."
      ]
    }
  },
  monolith: {
    intro: {
      id: 'monolith-intro',
      speaker: 'IRI',
      cta: 'Begin',
      pages: [
        "These weren't always ruins. Watchtowers, once — built to catch the first light of every dawn and pass it on, tower to tower, all the way to the sea.",
        "The Hush doesn't burn what it touches. It just… stops it. Obsidian doesn't reflect, doesn't pass anything through. If a beam meets it, that's the end of the beam.",
        "Some of the old mirrors are gilded shut — locked at the angle they died in. We won't turn those. We'll have to bend the Vale around them instead."
      ]
    },
    outro: {
      id: 'monolith-outro',
      speaker: 'IRI',
      cta: 'Onward',
      pages: [
        'Every Monolith we wake pushes the quiet back another mile. I can feel it thinning already.',
        "There's something past the last ridge — I've felt it since we started, getting louder with every Sanctuary. Two of them. Old. Warm.",
        'The Twin Suns. Where the First Light was born, before it was ever one flame. I think this is where the Hush actually started.',
        "If we can get them burning together again, the way they used to — I don't think the Hush comes back. Not here. Not ever."
      ]
    }
  },
  twin: {
    intro: {
      id: 'twin-intro',
      speaker: 'IRI',
      cta: 'Begin',
      pages: [
        'This is it. Two flames, one Vale — the oldest light there is. When they burned in balance, nothing here ever went dark.',
        'Something pulled them apart, long before the Hush ever had a name. And in the space between them — that’s where it was born.',
        "Every Sanctuary from here on needs both lights, not one. Chase them separately and you'll only ever light half the picture.",
        'Steady hands, Lightkeeper. This is the one we came for.'
      ]
    },
    outro: {
      id: 'twin-outro',
      finale: true,
      speaker: 'IRI',
      cta: 'Return to the Vale',
      pages: [
        "…There. Feel that? That's not a Sanctuary lighting up. That's the whole Vale, all at once.",
        "The Hush isn't gone — I don't think something that old ever really is. But it's quiet now. The good kind of quiet.",
        "I was one mote out of a thousand, and you turned every mirror it took to bring me home. I won't forget whose hands did that.",
        'Rest, Lightkeeper. The Vale will hold what we gave it. And if the dark ever creeps back in — well. You know where to find me.'
      ]
    }
  }
};
