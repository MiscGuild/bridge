import fetch from "node-fetch";

export default async function mojangPlayerGrabber(username) {
  	return await fetch(
    	`https://api.mojang.com/users/profiles/minecraft/${username}`
  	).then((res) => {
		return res.json();
	});
}
