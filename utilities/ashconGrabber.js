const fetch = require("node-fetch");

module.exports = async function uuidGrabber(username) {
	return await fetch(
		`https://api.ashcon.app/mojang/v2/user/${username}`
	).then((res) => {
		if (res.uuid) {
			res.uuid = res.uuid.replace("-","");
		}
		return res.json()
	});
};