import { EmbedBuilder } from 'discord.js';
import { FetchError } from '../util/fetchError';

export default function fetchErrorEmbed(requestError: FetchError): EmbedBuilder {
    return new EmbedBuilder()
        .setColor('Red')
        .setTitle('Error')
        .setDescription(
            `There was an error while attempting your request, a detailed log is below.\n\`\`\`Error: ${
                requestError.status ?? 'Unknown'
            }\nReason: ${requestError.statusText ?? 'No status text provided'}\`\`\``
        );
}
