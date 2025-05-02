const getRandomHexColor = (): string => {
    const hex = Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0');
    return `#${hex}`;
};

export default getRandomHexColor; // Export the function
