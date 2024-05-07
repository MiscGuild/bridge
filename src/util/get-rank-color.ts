export default (rank?: string) => {
    let color;

    switch (rank) {
        case '[ADMIN]':
        case '[YOUTUBE]':
            color = 0xf55;
            break;
        case '[MVP++]':
            color = 0xfa0;
            break;
        case '[MVP+]':
        case '[MVP]':
            color = 0x5ff;
            break;
        case '[VIP+]':
        case '[VIP]':
            color = 0x5f5;
            break;

        default:
            color = 0xaaa;
    }

    return color;
};
