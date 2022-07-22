async function getSkillTabTyp(skillTab) {
    //TODO: contorl if this part isn necessary, cause the few markers I saw seems to be pretty precis doing the overall calc with it, then go farther
    /** first check for word combinations then for single words */
    let markerArrayFinal = [];
    let combString = skillTab.marker.toLowerCase();
    //word combination check
    let wordCombinations = ['attack speed', 'cooldown reduction'];
    for (let wordComb of wordCombinations) {
        if (combString.includes(wordComb)) {
            markerArrayFinal.push(wordComb);
            combString = combString.replace(wordComb, '');
        }
    }

    //single words check
    combString = combString.trim();
    markerArrayFinal = combString.split(' ');

    //just testing if I have all markers
    markerArrayFinal.forEach((currentWord) => {
        switch (currentWord) {
            case 'damage':
                return 'damage';
            case 'physical':
                return 'ad';
            case 'shield':
                return 'shield';
            case 'health':
                return 'health';
            case 'magic':
                return 'magic';
            case 'heal':
                return 'heal';
            case 'movement':
                return 'movement';
            case 'disable':
                return 'disable';
            case 'armor':
                return 'armor';
            case 'mr':
                return 'mr';
            case 'resistances':
                return 'resistances';
            case 'silence':
                return 'silence';
            case 'blind':
                return 'blind';
            case 'recasts':
                return 'recasts';
            case 'slow':
                return 'slow';
            case 'immunity':
                return 'immunity';
            default:
                //console.log('unknown skillTab marker: \t', currentWord);
                return undefined;
        }
    });

    markerArrayFinal = markerArrayFinal.filter((currentWord) => currentWord != undefined);
    if (
        markerArrayFinal.includes('damage') &&
        !markerArrayFinal.includes('magic') &&
        !markerArrayFinal.includes('mixed') &&
        !markerArrayFinal.includes('true') &&
        !markerArrayFinal.includes('ad')
    )
        markerArrayFinal.push('ad');

    //console.log(markerArrayFinal.includes('damage'));
    //console.log(markerArrayFinal.includes('magic'));
    if (markerArrayFinal.length == 0) console.log(`cant specify marker type ${skillTab.marker}`);
    else return markerArrayFinal;
}

function evaluateScalingType(scaleType) {
    //TODO: debug karma .... she has second skillTabs behind every skillTab
    let scaling = [];
    let scalingType;
    let scalingCalc;
    //1. get the way the scaling
    if (scaleType.includes('%')) scalingCalc = '%';
    else scalingCalc = 'flat';

    scaleType = scaleType.toLowerCase();
    scaleType = scaleType.replace(/  /g, ' ');
    scaleType = scaleType.replace(/%/g, '');
    scaleType = scaleType.trim();

    switch (scaleType) {
        case 'ap':
            scalingType = 'ap';
            scaling.push(scaleType, scalingCalc);
            return scaling;
        case 'ad':
            scalingType = 'ad';
            scaling.push(scaleType, scalingCalc);
            return scaling;
        default:
            scalingType = 'not handled yet';
            scaling.push(scaleType, scalingCalc);
            return scaling;
    }
}

function calculateScaling(scaleFactor, scaleType, myStats) {
    /** Calculates the scaling factor depending on the factor, factorType and factorscaling.
     * @param	{int} 		scaleFactor		the flat factor
     * @param 	{array}		scaleType		[scaleTyp(ad/ap/hp....), scaleCalcModus(flat/%)]
     * @param 	{object}	baseStats		the calculated, based on level, baseStats of the Champ
     * @return	int		scaleResult		flat calculated value
     */
    let scaleResult = 0;
    let scaleTypeFactor;

    switch (scaleType[0]) {
        case 'ap':
            scaleTypeFactor = myStats.ap;
            break;
        case 'ad':
            scaleTypeFactor = myStats.ad;
            break;
        case 'hp':
            scaleTypeFactor = myStats.HP;
            break;
        case 'armor':
            scaleTypeFactor = myStats.armor;
            break;
        case 'mr':
            scaleTypeFactor = myStats.mr;
            break;
        case 'bonus ad':
            scaleTypeFactor = myStats.ad - myStats.baseAD;
            break;
        case 'per 100 ap':
            scaleTypeFactor = Math.floor(myStats.ap / 100);
            break;
        default:
            //TODO: debugging
            scaleTypeFactor = 0;
            console.error('cant figure out scaleTypeFactor');
    }

    switch (scaleType[1]) {
        case '%':
            scaleResult = (scaleFactor / 100) * scaleTypeFactor;
            break;
        default:
            console.log('cant calculate scaling factor');
    }

    return scaleResult;
}
