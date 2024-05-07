export default <T extends object>(key: any, obj: T): key is keyof T => key in obj;
