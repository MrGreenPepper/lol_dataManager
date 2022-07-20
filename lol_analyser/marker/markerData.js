export let searchMarkers = [/mixed magic damage/i, /(mixed).*?(damage)/i];

export let cleaningList = ['champion', 'non-minion'];
export let ignoreMarkerWords = [
	'mana',
	'minimum',
	'reduced',
	'energy',
	// 'per', 			per tick needs to be included
	'non-champion',
	' minion',
	'minion ',
	'monster',
	'trap',
	'width',
	'gold',
];

//let hardCCMarkers = ['knockup', 'stun'];
export let skillTabMarkers = {
	toUnifyMarkers: {
		25: {
			markers: [
				'dart damage', //eve
				'detonation damage', //swain E & graves Q
				'barrage damage', //irelia 'perimeter damage', //irelia 'non-champion damage', // jhin
				'slam damage', // pantheon
				'secondary damage', // rell
				'spike damage', // eve
			],
			unifiedMarker: 'damage',
		},
		3: {
			markers: [
				'sweetspot damage',
				'total increased damage',
				'total enhanced damage',
				'increased damage',
				'maximum total damage',
				'maximum champion damage',
				'maximum non-minion damage', // aatrox Q
				'empowered damage',
				'total damage',
				'enhanced damage',
				'maximum bonus damage',
				'capped',
				'total champion damage',
				'total maximum damage',
				'empowered damage per tick', // anivia R
				'maximum secondary damage', // jinx R
				'total non-minion damage', // lucian
				'capped damage per champion', // mundo
			],
			unifiedMarker: 'maximum damage',
		},
		1: {
			markers: ['total mixed damage', 'maximum mixed damage', 'increased mixed damage'],
			unifiedMarker: 'maximum mixed damage',
		},

		45: {
			markers: [
				'total single-target damage',
				'total single target damage',
				'maximum single-target damage',
				'maximum single target damage',
			],
			unifiedMarker: 'single maximum damage',
		},

		6: {
			markers: [
				'physical damage',
				'dash damage', //aatrox
				'bonus ad',
				'handle physical damage', //darius
				'initial physical damage', // graves Q
				'explosion physical damage', // graves R
			],
			unifiedMarker: 'physical damage',
		},
		2: {
			markers: [
				'bonus physical damage',
				'maximum physical damage',
				'total physical damage',
				'maximum single-target physical damage',
				'total damage per flurry',
				'macimum non-minion damage',
				'blade physical damage',
				'enhanced physical damage', // renekton
			],
			unifiedMarker: 'maximum physical damage',
		},

		4: {
			markers: [
				'mark damage', // LB
				'root damage', // LB
				'delayed damage', // LB
				'secondary magic damage', // Ashe R
				'bolt magic damage', //bc R
				'detonation magic damage', //bc R
				'magic damage base',
				'outward magic damage', //ekko Q
				'returning magic damage', //ekko Q
				'gust magic damage', //galio Q
				'champion magic damage', // galio E
				'initial rocket magic damage',
				'non-minion magic damage', //gragas Q
			],
			unifiedMarker: 'magic damage',
		},

		0: {
			markers: [
				'maximum magic damage',
				'total magic damage',
				'increased magic damage',
				'maximum bonus magic damage',
				'empowered magic damage',
				'increased bonus magic damage', //kassa
				'maximum single-target magic damage',
				'magic damage self-amplified', // ahri E
				'total tornado magic damage', // galio Q
				'non-minion maximum magic damage', // gragas Q
				'total bonus magic damage',
			],
			unifiedMarker: 'maximum magic damage',
		},
		20: {
			markers: ['ph'],
			unifiedMarker: 'maximum true damage', //darius
		},

		21: {
			markers: [
				'additional damage', //heimer
				'outer cone bonus damage', //camille Q
				'bonus on-hit damage', // fizz W
				'bonus damage per champion', // diana
			],
			unifiedMarker: 'bonus damage',
		},

		22: {
			markers: ['increased bonus damage', 'capped bonus damage', 'total bonus damage'],
			unifiedMarker: 'maximum bonus damage',
		},

		23: {
			markers: ['flat bonus ad'],
			unifiedMarker: 'bonus physical damage',
		},

		33: {
			markers: ['empowered bonus physical damage'],
			unifiedMarker: 'bonus physical damage',
		},

		24: {
			markers: ['ph'],
			unifiedMarker: 'bonus magic damage',
		},

		5: {
			markers: [
				'shroud duration', //akali
				'TARGET IMMUNITY',
				'invisibility',
				'stealth duration',
			],
			unifiedMarker: 'kind of immunity',
		},

		7: {
			markers: ['bonus true damage', 'true damage', 'champion true damage'],
			unifiedMarker: 'true damage',
		},

		8: {
			markers: ['bonus attack speed', 'enhanced attack speed'],
			unifiedMarker: 'attack speed',
		},

		32: {
			markers: ['enhanced bonus attack speed'],
			unifiedMarker: 'maximum attack speed',
		},

		26: {
			markers: [
				'self-heal', //ekko R
				'heal', // gp
				'heal per champion', // rell
				'champion healing', // renekton
				'health refund on hit', // mundo
			],
			unifiedMarker: 'healing',
		},
		9: {
			markers: [
				'increased healing', //aatrox
				'maximum self-heal', //lissandra
				'maximum total healing', //masteryi
				'enhanced heal', //soraka
				'world ender increased healing',
				'total regeneration', //mundo
				'total heal per non-minion', // fiddle W
				'capped healing', //heca E
				'total heal', //janna
				'enhanced champion healing', // renekton
			],
			unifiedMarker: 'maximum heal',
		},
		10: {
			markers: [
				//'shield',
				'shield strength',
				'health regained',
				'bonus health',
				//'maximum shield',
				'total shield strength', //diana
				'base shield', //j4
				'bonus shield per champion', //neeko
			],
			unifiedMarker: 'shield',
		},
		30: {
			markers: ['ph'],
			unifiedMarker: 'maximum shield',
		},
		11: {
			markers: [
				//'slow',
				'enhanced slow',
				'empowered slow',
			],
			unifiedMarker: 'maximum slow',
		},
		12: {
			markers: [
				'sleep duration',
				'knockup duration',
				'knock up duration',
				'stun duration',
				'maxed stun duration',
				'charm duration',
				'fear duration', //fiddle
				'taunt duration', // rammus
				'flee duration',
			],
			unifiedMarker: 'disable duration',
		},

		13: {
			markers: [
				'bonus movement speed',
				'enhanced movement speed',
				'increased movement speed',
				'initial bonus movement speed',
				'maximum bonus movement speed',
				'passive movement speed',
				'active movement speed',
				'movement speed',
				'static movement speed', //aurelion sol E
				'total movespeed', //both gnar Q
				'bonus movespeed', //both gnar Q
				'total movement speed increase', // quinn
			],
			unifiedMarker: 'movement speed modifier',
		},

		14: {
			markers: ['slow', 'root duration', 'root and reveal duration', 'cripple'],
			unifiedMarker: 'impared movement',
		},

		28: {
			markers: ['total root duration', 'empowered root duration'],
			unifiedMarker: 'maximum impared duration',
		},

		15: {
			markers: ['width impassable wall'], //azir R
			unifiedMarker: 'forms terretory',
		},

		16: {
			markers: ['self bonus armor'],
			unifiedMarker: 'bonus armor',
		},

		31: {
			markers: ['increased armor'],
			unifiedMarker: 'maximum armor', // graves E
		},

		17: {
			markers: ['self bonus mr'],
			unifiedMarker: 'bonus magic resistance',
		},

		18: {
			markers: ['maximum stun duration', 'maximum knockup duration'],
			unifiedMarker: 'maximum disable duration',
		},
	},
	unusedSkillTabMarkers: [
		'minion damage',
		'minimum stun duration',
		'minimum magic damage',
		'bonus movement speed duration',
		'maximum non-champion damage',
		'bonus range',
		'minimum damage',
		'minimum true damage',
		'mana restore per kill',
		'maximum mana restored',
		'magic damage per orb',
		'magic damage per mine',
		'reduced damage per mine',
		'decayed bonus movement speed',
		'minimum shield',
		'maximum monster damage',
		'damage per arrow', //Ashe Q
		'minimum heal', //Bard //*
		'ally bonus armor',
		'ally bonus mr', //Braum
		'reduced damage', //cait Q
		'maximum traps', //cait w
		'trap duration in seconds', //cait w
		'minion damage',
		'damage per pass', //ahri q
		'additional magic damage', //ahri E
		'pass through damage', //anivia Q
		'explosion damage', //anivia Q
		'width pathfinding',
		'number of ice segments',
		'distance between outermost segments', //aniv W
		'distance between individual segments', //aniv W
		'initial magic damage', // anni R
		'arrows', // ashe W
		'width', // azir R
		'width charge', //azir R
		'non-epic monster damge', //camille
		'bonus attack range per stack', //cho R
		'bonus size per stack', //cho R
		'mixed damge per tick', //corki
		'resistance reduction per tick', // corki
		'bonus damage per stack', //darius ult
		'total damage vs. 5 champions',
		'bonus  damage per champion', //diana ult - normal skilltab already includes 1 champion
		'health refund on kill', //mundo
		'regeneration per second', //mundo
		'minimum physical damage', //draven
		'minimum total damage', // draven
		'max. monster damage', // elise q
		'monster duration', //eve
		'increased minimum damage', //fiddle Q
		'last tick of damage', //fiddle W
		'heal per tick', //fiora R
		'mana refund', //fizz
		'non-champion magic damage', // galio E
		'gold plunder', //gp
		'silver serpent plunder', //gp
		'movement speed duration',
		'physical damage per spin', // garen E
		'minion magic damage', //gragas Q
		'minion maximum magic damage', //gragas Q
		'maximum damage to monsters', //gragas W
		'maximum minion damage', //heca W
		'additional minion damage', // heimer
		'total minion damage', //heimer
		'total minion magic damage', //heimer
		'magic damage per wave', //gp R
		'magic damage per cluster', //gp R
		'2-5 rocket magic damage', //heimer
		'6-20 rocket magic damage', //heimer
		'minion bonus damage', //irelia
		'bonus magic damage per second', // janna
		'mana restore',
		'minimum secondary damage',
		'mana restore', //kalista
		'root duration increase', //karma
		'minion total damage', //irelia
		'monster damage', //karthus
		'enhanced monster damage', //karthus
		'wall length',
		'damage per second',
		'mana restored',
		'reduced slow',
		'mana restored',
		'mana restored against champions',
		'physical damage per dagger', // kata
		'magic damage per dagger',
		'on-hit effectiveness',
		'capped monster damage per hit', //kayn
		'total capped monster damage',
		'magic damage per bolt', //kennen
		'monster damage', //kindred
		'minion and small monster damage', // kled
		'maximum damage against monsters', //kled
		'bonus attack range', //
		'total non-champion damage', //kayn
		'minimum self-heal',
		'physical damage per shot', //lucian
		'minion damage per shot',
		'shots fired',
		'voidling duration', //malzahar
		'damage per quarter-second',
		'damage per half-second',
		'increased damage per tick', // maokai
		'monster bonus damage', //master yi
		'reduced monster damage',
		'max monster single-target damage',
		'minimum healing per half second',
		'maximum healing per half second',
		'minimum total healing',
		'turret damage reduction',
		'post-channel turret damage reduction',
		'minimum damage per tick', //morgana
		'maximum damage per tick',
		'bonus magic damage per hit', //nami
		'additional slow per second', // nasus
		'additional cripple per second', // nasus
		'additional bloom damage', //neeko
		'total shield vs. 5 champions', //neeko
		'prowl-enhanced minimum damage', //nidalee
		'maximum initial monster damage', //poppy
		'total damage to targets beyond the first', //qiyana
		'structure damage per tick', // rammus
		'structure total damage', //
		'slow per tick',
		'non-champion healing', // renekton
		'enhanced non-champion healing',
		'mixed damage per tick', // corki
		'tornado magic damage per tick', // galio
	],

	usedSkillTabMarkers: [
		'increased attack speed',
		'damage reduction', //braum E
		'reduced physical damage', // poppy
		'duration', //braum E
		'healing',
		'magic damage per tick', // allister E & anivia R
		'silence duration',
		'total resistance reduction', //corki
		'armor penetration', //darius
		'magic penetration', // mordekaiser
		'maximum magic resistance', //mundo
		'magic resistance reduction',
		'armor reduction', // j4
		'resistances reduction', //kogmaw
		'magic damage shield', // galio W
		'magic shield',
		'bonus resistances', //kennen R
		'flat damage reduction',
		'post-channel damage reduction', // master yi
		'maximum cripple', //nasus
		'total minimum/minion damage', //ornn
		'minimum/minion damage per instance', //ornn
		'total monster damage',
		'monster damage per instance',
		'bonus attack speed duration', //rammus
		'maximum bonus ad', // mundo
		'mana refunded', // fizz
	],

	specialAttentionneeded: [
		'headshot damage increase',
		'total heal per minion', // fiddle W
		'critical damage', //fiora E
		'magic damage reduction', // galio W
		'physical damage reduction', // amumu E
		'nearest enemy damage per spin', // garen E
		'damage increase', //illaoi W
		'damage transmission', //illaoi E
		'damage per additional spear', // kalista
		'maximum attack speed', // jinx
		'passive damage', //kayle
		'static cooldown', //kindred
		'prowl-enhanced maximum damage', //nidalee
	],

	scalingMarkers: [
		'maximum missing health bonus ad', //mundo E
		'bonus health per stack', //cho R
		'heal percentage',
		'total magic damage withfire at will', //gp ult upgrades
		"maximum mixed total damage withfire at will and death's daughter", //gp ult upgrades
	],

	combinationMarkers: ['life steal', 'healing cap', 'enhanced healing cap'],
};

export let unifyWords = {
	maximum: ['increased', 'total', 'enhanced', 'empowered', 'capped', 'sweetspot'],
	heal: ['healing'],
};

export let baseWords = [
	'damage',
	'physical',
	'magic',
	'shield',
	'heal',
	'attack speed',
	'armor',
	'mixed',
	'ad',
];

export let baseCCWords = ['knock up', 'root', 'slow', 'stun', 'knockback', 'disable'];

export let enhancerWords = ['maximum', 'bonus', 'reduction', 'percentage'];
export let mobilityWords = ['movement speed', 'impared movement'];

export let fillerWords = ['strengh', 'strength', 'modifier'];
export let metaWords = ['duration', 'per tick'];

export let targetWords = ['champion', 'non-minion'];

export let ignoreWords = ['IGNORE THIS'];

export let combWords = [];
combWords.push(...Object.values(baseWords));
combWords.push(...Object.values(baseCCWords));
combWords.push(...Object.values(enhancerWords));
combWords.push(...Object.values(mobilityWords));
combWords.push(...Object.values(fillerWords));
combWords.push(...Object.values(metaWords));
combWords.push(...Object.values(targetWords));
combWords.push(...Object.values(ignoreWords));
