const getRandomHexColor = (): string => {
    const hex = Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, '0');
    return `#${hex}`;
};

export default getRandomHexColor;
