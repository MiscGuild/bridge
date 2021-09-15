const fetch = require("node-fetch");

module.exports = async function uuidGrabber(username) {
	const mojangAPI = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
		.then(res => {
			if(res.status == 200) {
				return res.json();
			}
			else {
				return false;
			}
		});
	return mojangAPI;
};