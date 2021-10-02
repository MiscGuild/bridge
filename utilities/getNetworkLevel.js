export default async function getNetworkLevel(exp) {
	return (Math.sqrt((2 * exp) + 30625) / 50) - 2.5;
};