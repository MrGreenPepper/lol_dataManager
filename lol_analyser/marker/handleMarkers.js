import * as analyser from '../analyser';

export async function handlerMarkers() {
	analyser.unifyAbilityMarkers();

	analyser.summarizeMarkers();

	analyser.categorizeMarkers();
	analyser.deleteAndCleanMarkers();
	analyser.showAllMarkerPositions();
}
