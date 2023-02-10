// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default <T extends object>(key: any, obj: T): key is keyof T => {
	return key in obj;
};
