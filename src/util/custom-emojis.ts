export default function replaceEmojis(content: string): string {
    let newContent = content;

    const emojis = {
        '💀': '☠',
        '😂': '☺',
        '😭': '☹',
        '👍': ':thumbs_up:',
        '🖐️': ':wave:',
        '🤝': ':handshake:',
    };

    Object.entries(emojis).forEach(([key, value]) => {
        newContent = newContent.replace(key, value);
    });

    const emojiRegex = /<a?(:[^:]+:)\d+>/g;

    return newContent.replaceAll(emojiRegex, '$1');
}