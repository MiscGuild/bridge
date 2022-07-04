import { FetchError } from "../../interfaces/FetchError";
import fetch from "node-fetch";

export default async (data: string) => {
	const response = await fetch(`https://fake-chat.matdoes.dev/render.png?m=custom&d=${encodeURIComponent(data)}&t=1`);

	return response.status === 200 ? await response.buffer() : (response as FetchError);
};
