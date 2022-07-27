import { FetchError } from "../../interfaces/FetchError";
import { EmbedBuilder } from "discord.js";

export default (requestError: FetchError) => {
	return new EmbedBuilder()
		.setColor("Red")
		.setTitle("Error")
		.setDescription(
			`There was an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${requestError.status}\nReason: ${requestError.statusText}\`\`\``,
		);
};
