import fetch from "node-fetch";

export default async function uuidGrabber(username) {
	return await fetch(
		`https://api.ashcon.app/mojang/v2/user/${username}`
	).then((res) => res.json()
	).then((data) => {
		if (data.uuid) {
			data.uuid = data.uuid.replaceAll("-", "");
		}
		return data;
	});
}