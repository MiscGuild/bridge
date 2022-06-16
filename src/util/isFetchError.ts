import { FetchError } from "../interfaces/FetchError";

export function isFetchError(response: any | FetchError): response is FetchError {
	return "status" && "statusText" in response;
}
