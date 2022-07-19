const fs = require('fs');
const analyseTools = require('./tools/analyseTools');
const checkMarkers = require('./tools/marker/checkMarkers');
const unifyMarkers = require('./tools/marker/unifyMarkers');
const summariesAbilities = require('./tools/marker/summariesMarkers');
const markerTools = require('./tools/marker/markerTools');
const conColor = require('./tools/consoleColor');
const extractor = require('./extractor/extractor.js');

async function start() {
    // restructure from scraper
    // await extractor.extractChampionData();

    /** loads championList and gives their names one by one to the analyser */
    let championList = await analyseTools.getChampionList();
    // let championList = ['Kindred'];

    for (let championName of championList) {
        conColor.green(championName);

        try {
            await analyseAbilities(championName);
        } catch (err) {
            console.log(championName, err);
        }
    }
    //	analyseAbilities('Aatrox');
}

async function analyseAbilities(championName) {
    /**loads the championData and controls the anlyse sequence
     * analyse sequence:
     * 1. load the championData
     * 2. cut and copy the skillsorder
     * 3. cleanUp the abilitiesData
     * 4. unify markers
     * 5. checks if there are any unknown markers
     * 6. summaries and the abilities and their markers
     * 7. saves the data
     */

    //i know the objects returns arent necessary but I like them for more clear structure
    //1.
    let championData = await analyseTools.loadRawData(championName);

    //2.
    championData.skillOrder = championData.abilities.skillsOrder;
    delete championData.abilities.skillsOrder;
    //metaNumbers to float;
    championData.abilities = await markerTools.metaNumbersToFloat(championData.abilities);
    //2.1
    championData.abilities.skillTabs = await markerTools.createSkillTabArray(
        championData.abilities
    );
    //all mathStrings to Math;
    // championData.abilities = await markerTools.allStringsToMath(championData.abilities);
    //3.
    championData.abilities = await analyseTools.cleanAbilities(championData.abilities);
    //4.
    championData.abilities = await unifyMarkers.start(championData.abilities);

    //5.
    await checkMarkers.start(championData.abilities);

    //5.2
    await markerTools.showAllMarkerPositions(championData.abilities);
    //6.
    championData.abilities = await summariesAbilities.start(championData.abilities);
    //7.
    analyseTools.saveData(championData);
}

async function checkTypes(ability) {}

async function calculateDamage(ability) {}

start();
