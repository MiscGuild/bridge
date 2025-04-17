export const getRandomHexColor = (): string =>
    `#${(Math.random() * 0xffffffffff | 0).toString(16).padStart(6, '0')}`;
