import { FetchError } from "../../interfaces/FetchError";
import { MojangProfileResponse } from "../../interfaces/MojangProfileResponse";
import fetch from "node-fetch";

export default async (username: string) => {
	const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);

	return response.status === 200 ? ((await response.json()) as MojangProfileResponse) : (response as FetchError);
};
