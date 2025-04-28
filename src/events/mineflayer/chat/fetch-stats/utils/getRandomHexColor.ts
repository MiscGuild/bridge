export const getRandomHexColor = (): string =>
    `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
