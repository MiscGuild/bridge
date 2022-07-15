import { FetchError } from "../../interfaces/FetchError";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (response: any | FetchError): response is FetchError => {
	return !response || ("status" in response && "statusText" in response);
};
