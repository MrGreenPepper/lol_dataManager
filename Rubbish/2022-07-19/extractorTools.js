//aim of all following functions is to get some further processable data from raw data like text etc.

const fs = require('fs');
const extractor = require('./extractor');
const { SSL_OP_LEGACY_SERVER_CONNECT } = require('constants');

function getTheFormulaData(championData) {
  //extracts the skilltabs, , leveling process
  championData = extractor.extract_skillTabs(championData);
  championData = extractor.extract_abilitiesText(championData);
  championData = extractor.extract_levelingProcess(championData);
}
function rawDataSQLcleanup(championRawData) {
  return new Promise((resolve) => {
    //cleanup champion name first
    championRawData.name = championRawData.name.replace(' (League of Legends)', '');
    championRawData.name = championRawData.name.replace("'", '');
    championRawData.name = championRawData.name.replace('.', '');
    championRawData.name = championRawData.name.replace(' ', '_');
    //change percantage string to a real number
    switch (typeof championRawData.baseStats.windup) {
      case 'number': {
        break;
      }
      case 'string': {
        if (championRawData.baseStats.windup.indexOf('%') > -1) {
          let text;
          let number;
          championRawData.baseStats.windup = championRawData.baseStats.windup.replace('%', '');
          championRawData.baseStats.windup = championRawData.baseStats.windup.replace(' ', '');
          number = parseFloat(text);
          number = number / 100;
          break;
        }
      }
      default:
        console.log('percentChanger(f): - cant detect type of input: ', rawText);
    }

    //cleanup the text content

    let abilitykeys = Object.keys(championRawData.abilities);

    for (let i = 0; i < abilitykeys.length; i++) {
      for (
        let textContentKey = 0;
        textContentKey < championRawData.abilities[abilitykeys[i]].textContent.length;
        textContentKey++
      ) {
        championRawData.abilities[abilitykeys[i]].textContent[
          textContentKey
        ].text = championRawData.abilities[abilitykeys[i]].textContent[textContentKey].text.replace(
          /\n/g,
          ''
        );
        championRawData.abilities[abilitykeys[i]].textContent[
          textContentKey
        ].text = championRawData.abilities[abilitykeys[i]].textContent[textContentKey].text.replace(
          /"/g,
          ''
        );
      }
    }

    resolve(championRawData);
  });
}

/**from getChampionList() list of champion --> getMathData is the entry point to get usable data out of the text
//async function getMathData(championList) {
	//for each champion 1. get the data from db and divide Text into meaningful parts 2. get some Numbers out of it 3. save it into db
//	for (championName of championList) {
		//1. get the data from db and divide Text into meaningful parts
	//	let partedChampionData = await divideTextintoParts(championName);
		//2. get some Numbers out of it
		//let mathData = await getMathfromParts(partedChampionData);
		//3. save it into db
		//let sql = mathDataToSQL(mathData);
		//dbControl.dbquery(sql);
	}
}
*/

function firstSeperation_isItMath(sign) {
  switch (sign) {
    case '/':
      return true;
      break;
    case '%':
      return true;
      break;
    case ' ':
      return true;
      break;
    case '+':
      return true;
      break;
    case '"':
      return true;
      break;
    case ':':
      return true;
      break;
    case '-':
      return true;
      break;
    case '−':
      return true;
      break;
    case '»':
      return true;
      break;
    case '(':
      return true;
      break;
    case ')':
      return true;
      break;
    case '.':
      return true;
      break;
    default:
      if (isNaN(sign) == false) return true;
      return false;
  }
}

function isItMath(sign) {
  switch (sign) {
    case '/':
      return true;
      break;
    //testing this out to get the % into the text parts in skillTabs, but didnt test it for other parts
    case '%':
      return false;
      break;
    case ' ':
      return true;
      break;
    case '+':
      return true;
      break;
    case '"':
      return true;
      break;
    case ':':
      return true;
      break;
    case '-':
      return true;
      break;
    case '−':
      return true;
      break;
    case '»':
      return true;
      break;
    case '(':
      return false;
      break;
    case ')':
      return false;
      break;
    case '.':
      return true;
      break;
    default:
      if (isNaN(sign) == false) return true;
      return false;
  }
}

function cleanMath(cleanMathContent) {
  cleanMathContent = cleanMathContent.replace(/\//g, '');
  cleanMathContent = cleanMathContent.replace(/:/g, '');

  cleanMathContent = cleanMathContent.replace(/«/g, '');
  cleanMathContent = cleanMathContent.replace(/»/g, '');

  cleanMathContent = cleanMathContent.trim();
  //next 2 lines seems like the same but the first space is copied out and some kind of different from the last space
  cleanMathContent = cleanMathContent.replace(/ /g, '');
  cleanMathContent = cleanMathContent.replace(/ /g, '');
  return cleanMathContent;
}

function getActiveMarkers(currentMarker, text, type) {
  let testIntervalls = [];
  for (let n = 0; n < currentMarker.length; n++) {
    let position = text.toLowerCase().indexOf(currentMarker[n]);
    if (position > -1) currentMarker[n] = [currentMarker[n], true, position];
    else currentMarker[n] = [currentMarker[n], false, -1];

    // sort the currentMarker by there apperance to slide the text later
    currentMarker.sort((a, b) => {
      if (a[2] > b[2]) return 1;
      if (a[2] < b[2]) return -1;
      return 0;
    });

    let activeMarkers = currentMarker.filter((element) => {
      return element[1];
    });

    // get the possible maximum length for the  intervalls to check them later
    for (i = 0; i < activeMarkers.length; i++) {
      // for the last marker the maximum end is equal to the end of the text
      if (i + 1 == activeMarkers.length) {
        testIntervalls[i] = [];
        testIntervalls[i][0] = activeMarkers[i][2];
        testIntervalls[i][1] = text.length;
      } else {
        testIntervalls[i] = [];
        testIntervalls[i][0] = activeMarkers[i][2];
        testIntervalls[i][1] = activeMarkers[i + 1][2];
      }
    }
    //check the intervalls
    for (i = 0; i < testIntervalls.length; i++) {
      let lastNumberIndex = 0;
      let testText = text.slice(testIntervalls[i][0], testIntervalls[i][1]);
      //prepare the testText
      testText = testText.toLowerCase();
      testText.replace(activeMarkers[i][1], '');
      testText = testText.replace(/a, b, n/g, '');

      // at the first num jump into the "math sign mode" until a char appears then return the index of the last number
      console.log('origin testText: ', testText);
      /*let slicepoint = 1;
		for (let n = 0; n < testText.length; n++) {
			if (!markers_isItMath(testText.charAt(n))) 
                {testText = testText.slice(slicepoint);}
                else {
                	slicepoint++;
                }

		}*/
      activeMarkers[(i, 3)] = testText;
    }
    return activeMarkers;
  }
}
function mathDataToSQL(data) {
  let sqlData = data;
  return sqlData;
}
function markers_clean_skilltab(text) {
  text = text.replace(/a/g, '');
  text = text.replace(/b/g, '');
  text = text.replace(/c/g, '');
  text = text.replace(/d/g, '');
  text = text.replace(/e/g, '');
  text = text.replace(/f/g, '');
  text = text.replace(/g/g, '');
  text = text.replace(/h/g, '');
  text = text.replace(/i/g, '');
  text = text.replace(/j/g, '');
  text = text.replace(/k/g, '');
  text = text.replace(/l/g, '');
  text = text.replace(/m/g, '');
  text = text.replace(/n/g, '');
  text = text.replace(/o/g, '');
  text = text.replace(/p/g, '');
  text = text.replace(/q/g, '');
  text = text.replace(/r/g, '');
  text = text.replace(/s/g, '');
  text = text.replace(/t/g, '');
  text = text.replace(/u/g, '');
  text = text.replace(/v/g, '');
  text = text.replace(/w/g, '');
  text = text.replace(/x/g, '');
  text = text.replace(/y/g, '');
  text = text.replace(/z/g, '');
  text = text.replace(/:/g, '');
  text = text.replace(/ /g, '');
  //text.replace(//g,'');
}
function firstClean(text) {
  text = text.replace(/\«/g, '');
  text = text.replace(/\»/g, '');
  text = text.replace(/\(/g, '');
  text = text.replace(/\)/g, '');
  text = text.replace(/\:/g, '');
  text = text.trim();
  return text;
}
function cleanText(text) {
  text = text.replace(/\«/g, '');
  text = text.replace(/\»/g, '');
  text = text.replace(/\(/g, '');
  text = text.replace(/\)/g, '');
  text = text.trim();
  return text;
}
function markers_isItMath(sign) {}

async function divideText() {
  //1.1 get the data from db and  1.2 divide Text into meaningful parts
  //1.1 get the data from db
  //--> TODO: get it into the shape ... getting 1 Text part and divide this into markers and math
  let markers_meta = [
    'range',
    'cooldown',
    'speed',
    'cast time',
    'effect radius',
    'cost', //TODO: mana/energy etc. need an extra math category
    'width',
  ];
  let markers_text = ['movement', 'dash', 'teleport', 'snared', 'stunned', 'knocked up', 'reset'];
  //TODO: resets ..... basic attack /cooldown
  let markers_skilltab = [
    'basic attack',
    'true damage',
    'physical damage',
    'magic damage',
    'heal',
    'shield',
  ];
  markers = [];
  markers.push(...markers_meta, ...markers_skilltab, ...markers_text);

  //get the raw champion data
  let sql_syntax = `SELECT * FROM lol_scraper.rawData_${championName}`;
  dbControl.dbquery(sql_syntax, false).then((rawText) => {
    //console.log(rawText);

    let rawData = rawText[0];
    //aim for championData = {"name", "specials", "abilities": #:{}}
    let championData = { name: championName, specials: '', abilities: {} };

    //1.2 divide Text into meaningful parts
    let rawDataKeys = Object.keys(rawData);
    // check if there is an active and a passive part in the ability
    let abilityTextKeys = rawDataKeys.filter((element) => element.indexOf('_textContent') > -1);

    for (let i = 0; i < abilityTextKeys.length; i++) {
      let markers_active = [];
      let abilityNameKey = 'ability' + i + '_name';
      championData.abilities[i] = {};
      championData.abilities[i].name = rawData[abilityNameKey];
      let currentAbilityText = rawData[abilityTextKeys[i]];
      // cut the name
      currentAbilityText = currentAbilityText.slice(championData.abilities[i].name.length);
      //console.log(currentAbilityText);

      markers_active.push(getActiveMarkers(markers_meta.slice(0), currentAbilityText, 'meta'));
      markers_active.push(getActiveMarkers(markers_text.slice(0), currentAbilityText, 'text'));
      markers_active.push(
        getActiveMarkers(markers_skilltab.slice(0), currentAbilityText, 'skilltabs')
      );

      championData.abilities[i].markers = markers;

      championData.abilities[i].markers_active = markers_active;

      championData.abilities[i].textContent = currentAbilityText;
    }
    console.log(championData);
  });
}

module.exports.isItMath = isItMath;
module.exports.firstSeperation_isItMath = firstSeperation_isItMath;

module.exports.cleanText = cleanText;
module.exports.cleanMath = cleanMath;
module.exports.rawDataSQLcleanup = rawDataSQLcleanup;
//module.exports.divideTextintoParts = divideTextintoParts;
//module.exports.getMathfromParts = getMathfromParts;
//module.exports.getMathData = getMathData;

module.exports.getTheFormulaData = getTheFormulaData;
module.exports.firstClean = firstClean;
