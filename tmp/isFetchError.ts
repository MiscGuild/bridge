import { FetchError } from "../interfaces/FetchError";

export default (response: any | FetchError): response is FetchError => {
	return "status" && "statusText" in response;
};
