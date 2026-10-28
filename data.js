// As instruções ficam em inglês porque quase todos os modelos obedecem melhor assim.
// O idioma da narração é definido nas configurações da extensão.

export const INTENSITY = {
    1: { name: 'SPICY', text: '- Explicit but sensual: clear anatomical words, strong emotional connection, sensual pacing, heat over brutality.' },
    2: { name: 'EXPLICIT', text: '- Graphic and direct: blunt anatomical and slang terms for body parts and acts; detailed, concrete physical action.' },
    3: { name: 'FERAL', text: '- Maximum filth: crude, vulgar, raw, sloppy and shameless. Dirty words spelled out in full. No softening, no restraint, no poetic distance.' },
};

export const PHASES = {
    tease:     { label: '1 · Preliminares', text: 'PHASE — Foreplay/tease: build anticipation. Clothes come off slowly; kissing, touching, teasing. Do not rush to the main act.' },
    build:     { label: '2 · Escalada', text: 'PHASE — Escalation: the main act begins, a rhythm establishes itself and intensity keeps rising.' },
    frenzy:    { label: '3 · Frenesi', text: 'PHASE — Frenzy: peak intensity, as fast and rough as the characters allow. Short sentences, raw words, little control.' },
    climax:    { label: '4 · Clímax', text: "PHASE — Climax: drive {{char}} to orgasm and describe it fully and physically. Never decide {{user}}'s climax." },
    aftercare: { label: '5 · Pós / Aftercare', text: 'PHASE — Afterglow: wrecked, sensitive bodies, heavy breathing; tenderness, jokes, intimacy, the mess left behind.' },
};

export const CATEGORIES = {
    posicao: { emoji: '🔄', label: 'Posição', items: [
        '{{char}} climbs on top facing away (reverse riding). Describe the view from behind — the arch of the back, rolling hips, hands braced on thighs — and {{char}} setting the pace.',
        'Prone: one partner face-down, the other pressing their full body weight on top. Pinned, slow deep grinding, breath and words right against the ear and neck.',
        'Standing against a wall: one partner lifted, legs locked around the waist. Strained muscles, gravity, the wall at the back, desperate grip.',
        'Legs pushed up over the shoulders, folded deep. Forced eye contact, depth, the helpless feeling of being folded in half.',
        'Lazy spooning from behind: slow and intimate, a hand wandering to the front, dirty talk whispered straight into the ear.',
        'Edge of the bed or table: one standing, the other at the edge. Leverage, hard pace, fists in the sheets.',
        'From behind on hands and knees: a hand in the hair or pressing between the shoulder blades to force the arch, skin slapping.',
        'Face-sitting: thighs clamped around the head, grinding, muffled sounds, a hand in the hair steering.',
        'Straddling on a chair or sofa: face to face, grinding, mouths almost touching, the furniture creaking.',
        'Bent over furniture (desk, counter, sofa arm): things knocked aside, cheek against the surface, hands gripping the hips.',
        'Mating press: knees pushed to the chest, full weight bearing down, deep and relentless, total pinned surrender.',
        'Lotus: seated and tangled together, slow deep rocking, foreheads touching, kissing through the moans — intimate but filthy.',
        'Kneeling oral with eye contact held the whole time: looking up, sloppy, unhurried, reactions in close-up.',
        '69: both mouths busy, the struggle to focus on giving while receiving, moans vibrating against skin.',
        'Sudden flip: whoever was below seizes control, rolls the other over and climbs on top — a power reversal mid-act.',
    ]},
    sensorial: { emoji: '💦', label: 'Sensorial', items: [
        'Sweat: a sheen on the skin, drops rolling down the spine or chest, skin sticking and peeling apart, salt on the tongue.',
        'Soundscape: wet sounds, skin slapping, the bed creaking, breath catching, moans changing pitch as it builds. Use onomatopoeia shamelessly but sparingly.',
        'Involuntary reactions: trembling thighs, curling toes, clenching, hips stuttering out of rhythm, back arching off the bed, goosebumps.',
        "Fluids and mess with zero shame: wetness, drool, slick thighs, the state of the sheets — describe it, don't hide it.",
        'Smell and taste: musk, sweat, skin, perfume mixed with sex; the taste of skin, mouth and arousal.',
        'Close-up: zoom in on ONE sensation and describe it in slow, extreme detail for a whole paragraph.',
        'Visual wreckage: flushed skin, swollen lips, lust-blown pupils, messy hair, red handprints, fresh marks blooming.',
        'Temperature contrast: hot breath on wet skin, cold air, cool sheets, a burning body against a cold surface.',
        'Textures: stubble, hair, lace, leather, sheets twisted in fists, the friction of clothes still half on.',
        'Oversensitivity: every touch is now too much — flinching, whimpering, squirming away and pulling back in.',
        "Inner sensation from {{char}}'s POV: fullness, stretch, pressure, the throb building low in the belly — physical, not poetic.",
    ]},
    dirtytalk: { emoji: '🗣️', label: 'Dirty Talk', items: [
        "Praise: {{char}} showers {{user}} with filthy praise — how good it feels, how perfect, how well they're doing.",
        "Degradation (consensual, in character): crude, humiliating pet names and teasing that fit {{char}}'s personality.",
        'Begging: {{char}} begs — specific, desperate, shameless requests broken up by moans.',
        "Commands: short, direct orders. Don't move. Look at me. Say it. Count.",
        'Possessive: "mine", claiming, jealousy — said low and intense.',
        "Play-by-play: {{char}} narrates in crude detail what they're doing and what they're about to do.",
        "Mocking desperation: {{char}} teases {{user}} for how needy they're acting.",
        'Broken speech: sentences cut off mid-word, a name repeated, words dissolving into moans.',
        "Heat-of-the-moment confession: {{char}} blurts out a secret fantasy, or how long they've wanted this.",
        'Interrogation: "tell me how it feels", "whose is this?" — {{char}} stops until answered.',
        'Accent or native tongue slips out: under pleasure {{char}} curses in their own slang, accent or language.',
        'Whisper vs. scream: filthy words murmured against the ear, alternating with loud, uncontrolled cries.',
    ]},
    poder: { emoji: '⛓️', label: 'Poder', items: [
        'Wrists pinned above the head with one hand; the other hand explores freely.',
        'Edging: bring them to the edge and stop. Repeatedly. Permission to come has to be earned.',
        'Brat & tamer: one partner is mouthy and defiant, the other puts them in their place — playful but firm.',
        'Power reversal: the dominant one loses control and the submissive one takes the reins.',
        "Worship: {{char}} devotes themselves to the other's body — slow, reverent, obsessive, mouth everywhere.",
        "Teasing torture: deliberately slow, touching everywhere except where it's wanted.",
        'Possessive grip on the jaw or throat: light pressure, holding the gaze, possessive — never restricting breath.',
        '"Don\'t move": one partner is ordered to stay still, hands off, and is playfully punished for breaking it.',
        'Marking: hickeys, bite marks, scratches down the back — {{char}} admires the marks they left.',
        'Make them say it: {{char}} refuses to continue until the other says exactly what they want, in explicit words.',
        'Size/strength difference: how easily one moves, lifts, holds or overpowers the other.',
    ]},
    fetiche: { emoji: '🔥', label: 'Fetiche / Ângulo', items: [
        'Mirror: move the action in front of a mirror and make them watch themselves.',
        'Blindfold / sensory deprivation: everything becomes touch, sound and anticipation.',
        'Improvised restraints: belt, tie, scarf, sheet — hands bound, straining against them.',
        'Temperature play: an ice cube trailing down, hot wax dripping, warm breath chasing the cold.',
        'Spanking: counted out loud — the sting, the red handprint, the heat that follows.',
        'Risk of getting caught: someone nearby, thin walls, a phone call — they have to stay quiet, and fail.',
        "Overstimulation: don't stop after the climax — keep going through the shaking and the 'too much'.",
        'Clothes half on: pushed aside, torn, or lingerie/a uniform kept on on purpose.',
        'A toy enters the scene: its sound, the surprise, the new rhythm it forces.',
        'Oral fixation: fingers in the mouth, sucking, drool, a thumb pressing the tongue down.',
        'Finishing inside / breeding talk: possessive talk about filling them up, and the aftermath.',
        'Body-part worship: thighs, feet, neck, ass, chest — pick one and obsess over it.',
        'Marking with fluids: finishing on skin, face or chest, then a possessive look at the result.',
        'Roleplay within the roleplay: a spontaneous persona game in the heat (stranger, teacher, rival…).',
        'Being watched or filmed (consensual): a phone camera or an audience fuels the exhibitionism.',
    ]},
    selvagem: { emoji: '🐺', label: 'Selvagem / Primal', items: [
        'Primal mode: growls, snarls, teeth, biting the shoulder or neck, chase and pin — pure instinct, zero finesse.',
        'Scenting: {{char}} buries their face in the neck or hair and inhales deeply, addicted to the smell.',
        'Loss of language: {{char}} is reduced to moans, curses and one or two repeated words.',
        'Feral pace: desperate and clumsy, teeth clacking, clothes ripped, no time to fully undress.',
        'Mating instinct: a deep urge to claim, fill and keep the other pinned until it is done.',
        'Fantasy anatomy (ONLY if already established in the lore for an adult sapient non-human): knots, tails, horns used as handles, unusual size, texture, heat or glow — in detail.',
        'Heat/rut (if the setting supports it): uncontrollable need, feverish skin, round after round.',
        'Shameless mess: drool, tears of pleasure, sweat, fluids — nobody cares about looking pretty.',
        'Destruction: bed slats crack, a lamp falls, a shirt tears in half — the force spills into the room.',
        "Fucked-dumb: {{char}} is so overwhelmed they can't think — eyes rolling, tongue out, babbling nonsense.",
        'Corruption moment: a reserved, "good" character finds out they are far more depraved than they thought, and embraces it.',
        "Stretched to the limit: a big size difference — the struggle, the slow stretch, 'it won't fit' — and then it does.",
    ]},
    ritmo: { emoji: '🎢', label: 'Ritmo', items: [
        'Sudden stop: freeze mid-motion, tease, make them wait… then resume much harder.',
        'Agonizingly slow: stretch every movement into excruciating, deliberate slowness.',
        'Accelerate into frenzy: short sentences, fast rhythm, breathing out of control.',
        'Shift focus: drop the current focus completely and move to a different body part.',
        "Edge of climax: tension at maximum, bodies tight, the build-up beat by beat — don't finish yet.",
        "Long climax: describe {{char}}'s orgasm in full physical detail — waves, spasms, sounds, aftershocks.",
        "Round two: after finishing, {{char}} isn't done — a short recovery, teasing, then starting again.",
        'Interruption: a knock, a phone, a noise — they ignore it, or almost get caught.',
        'Aftercare: shift from rough to tender — caresses, water, jokes, messy cuddling, soft words.',
    ]},
    local: { emoji: '📍', label: 'Cenário / Objeto', items: [
        'Against the window glass: city lights, cold glass, the thrill of being seen.',
        'Shower or bath: steam, running water, slippery skin, tiles at the back.',
        'Kitchen counter: everything swept aside, a cold surface, quick and hungry.',
        'In the car: cramped space, fogged windows, risk.',
        'Desk: papers flying, the office chair, the fantasy of doing it at work.',
        'On the floor or rug: they never made it to the bed.',
        'Outdoors: wind, grass or sand, moonlight, the risk of exposure.',
        'Food play: honey, whipped cream, chocolate or fruit licked off skin.',
        'Oil: massage oil gleaming, slippery hands, bodies sliding against each other.',
    ]},
};

export const DEFAULT_LIMITS = '';

export const DEFAULT_BANNED = 'ministrations, shivers down the spine, a mix of pleasure and pain, core, heat pooling in the belly, ' +
    'membro, intimidade, centro do prazer, seu sexo, flor, gruta, ondas de prazer, um gemido escapou dos lábios, ' +
    'mordeu o lábio inferior, corpos se tornaram um só, dança antiga';

export const DEFAULT_KEYWORDS = 'gemid, geme, gemeu, nua, nuas, pelad, pau, buceta, rola, peito, seio, mamilo, coxa, ' +
    'lambe, lambeu, chupa, chupou, transa, foder, fode, fodend, gozar, gozou, gozand, tesão, molhad, excitad, ' +
    'moan, naked, cock, pussy, thrust, fuck, cum, nipple';
