const conColor = require('../consoleColor');
const markerData = require('./markerData');
const markerTools = require('./markerTools');

let unifyWords = { maximum: ['increased', 'total', 'enhanced'] };

async function start(championAbilities) {
  /**
   * gets only the the abilityData from a champion and handles the different marker opperations
   * first it checks if there are new/unhandled markers
   * afterwards it unifies the markers for later use
   *
   * @param {object} championAbilities - all abilities from one champion
   *
   */
  for (let i = 0; i < 5; i++) {
    let currentAbility = championAbilities[i];
    conColor.yellow(currentAbility.name);

    await checkMetaMarkers(currentAbility);

    championAbilities[i] = currentAbility;
  }
  // TODO change to allSkillTabs

  await markerTools.applyToAllSkillTabs(championAbilities.skillTabs, ckeckSkillTabMarkers);
}

async function checkMetaMarkers(currentAbility) {
  /**
     *checks if all metaMarkersi from one ability are known or if there are new/unhandled ones
     @param {object} currentAbility - the current ability (Q-W-E ...) to check
     */
  let metaKeys = Object.keys(currentAbility.metaData);

  let usedMetaMarkers = [
    'STATIC COOLDOWN',
    'COOLDOWN',
    'CAST TIME',
    'TARGET RANGE',
    'RANGE',
    'ATTACK RANGE',
  ];
  let unusedMetaMarkers = [
    'SPEED',
    'WIDTH',
    'EFFECT RADIUS',
    'COST',
    'ANGLE',
    'TETHER RADIUS',
    'RECHARGE',
    'INNER RADIUS',
    'COLLISION RADIUS',
  ];

  let metaMarkers = [...usedMetaMarkers, ...unusedMetaMarkers];
  for (mK in metaKeys) {
    if (!(metaMarkers.indexOf(currentAbility.metaData[mK].marker) > -1))
      console.log('\tunhandled metaMarker: \t', currentAbility.metaData[mK].marker);
  }
  return;
}

async function ckeckSkillTabMarkers(skillTab) {
  /**
     *checks if all markers from the different skillTabs of one ability
     *are known or if there are new/unhandled ones
     @param {object} currentAbility - the current ability (Q-W-E ...) to check
     */
  //let markerData.skillTabMarkers = await getAllSkillTabMarkers();

  try {
    let currentSkillTabMarker = skillTab.marker;
    if (await checkPossibleCombinations(currentSkillTabMarker)) {
      //	console.log('known comb: ', currentSkillTabMarker);
    } else {
      console.log('\tunhandled skillTab marker: \t', currentSkillTabMarker);
    }
  } catch (err) {
    console.log(err);
    console.log(skillTab);
  }

  return skillTab;
}
async function checkPossibleCombinations(fullMarker) {
  /** checks if the marker consists of a already known combination of words.
   * returns true when the combination is known
   *
   * 2. unify words (increased, maximum, total)
   * 3. checks for combinations
   */
  let combiner = markerData.combWords;

  for (combWord of combiner) {
    fullMarker = fullMarker.replace(combWord, '');
  }

  fullMarker = fullMarker.replace(' ', ' ');
  fullMarker = fullMarker.trim();

  if (fullMarker.length > 0) {
    console.log('unknown word: ', fullMarker);
    return false;
  } else {
    return true;
  }
}

module.exports = { start };
