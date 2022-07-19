const conColor = require('../consoleColor');
const markerData = require('./markerData');
const markerTools = require('./markerTools');

async function start(abilityData) {
  abilityData.skillTabs = await markerTools.applyToAllSkillTabs(
    abilityData.skillTabs,
    unifyWording
  );

  abilityData.skillTabs = await markerTools.applyToAllSkillTabs(
    abilityData.skillTabs,
    unifyMarkers
  );

  return abilityData;
}

async function unifyWording(skillTab) {
  /**
   * seperates the words from each other and checks if they can be replaced by a unified version
   * (f.e.: enhanced, increased etc. --> maximum)
   */
  let currentSkillTabMarker = skillTab.marker;
  let unifyWordingKeys = Object.keys(markerData.unifyWords);
  let seperatedWords = [];
  let newMarkerString = '';
  seperatedWords = await wordSeperator(skillTab);

  for (let i = 0; i < seperatedWords.length; i++) {
    let word = seperatedWords[i];

    for (key of unifyWordingKeys) {
      if (markerData.unifyWords[key].indexOf(word) > -1) word = key;
    }

    seperatedWords[i] = word;
  }

  for (let i = 0; i < seperatedWords.length; i++) {
    newMarkerString = newMarkerString.concat(seperatedWords[i], ' ');
  }
  newMarkerString = newMarkerString.trim();
  skillTab.marker = newMarkerString;
  return skillTab;
}

async function wordSeperator(tempSkillTabMarker) {
  tempSkillTabMarker = tempSkillTabMarker.trim();
  wordsArray = tempSkillTabMarker.split(' ');

  return wordsArray;
}

async function wordSeperator(skillTab) {
  let marker = skillTab.marker;
  marker = marker.trim();
  wordsArray = marker.split(' ');

  return wordsArray;
}

async function unifyMarkers(skillTab) {
  /** replaces specific markers with unified ones */
  let toUnifyKeys = Object.keys(markerData.skillTabMarkers.toUnifyMarkers);
  let currentSkillTabMarker = skillTab.marker;

  for (key of toUnifyKeys) {
    if (
      markerData.skillTabMarkers.toUnifyMarkers[key].markers.indexOf(currentSkillTabMarker) > -1
    ) {
      currentSkillTabMarker = markerData.skillTabMarkers.toUnifyMarkers[key].unifiedMarker;
    }
  }
  //already executed earlier @ start function ... second execute needed?

  skillTab = await unifyWording(skillTab);
  return skillTab;
}

module.exports = { start };
