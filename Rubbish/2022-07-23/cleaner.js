export default function cleaner() {
	const chaName = function (chaName) {
		chaName = chaName.replace(' ', '_');
		chaName = chaName.replace("'", '');
		chaName = chaName.replace('.', '');
		return chaName;
	};
}
