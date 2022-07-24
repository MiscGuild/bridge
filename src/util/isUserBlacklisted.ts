import { BlacklistEntry } from "../interfaces/BlacklistEntry";
import _blacklist from "./_blacklist.json";

export default (uuid: string) => {
	const blacklist = _blacklist as BlacklistEntry[];
	return blacklist.some((entry) => entry.uuid === uuid);
};
