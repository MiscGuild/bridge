import { FetchError } from "../../interfaces/FetchError";
import { HypixelPlayerResponse } from "../../interfaces/HypixelPlayerResponse";
import fetch from "node-fetch";

export default async (username: string) => {
	const response = await fetch(
		`https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&name=${username}`,
	);

	return response.status === 200
		? ((await response.json()).player as HypixelPlayerResponse)
		: (response as FetchError);
};
