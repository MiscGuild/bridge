import { FetchError } from "../../interfaces/FetchError";
import { HypixelGuildResponse } from "../../interfaces/HypixelGuildReponse";
import fetch from "node-fetch";

export default async (uuid: string) => {
	const response = await fetch(`https://api.hypixel.net/guild?key=${process.env.HYPIXEL_API_KEY}&player=${uuid}`);

	return response.status === 200
		? (((await response.json()) as any).guild as HypixelGuildResponse) // eslint-disable-line @typescript-eslint/no-explicit-any
		: (response as FetchError);
};
