export default (response: any | FetchError): response is FetchError =>
    !response || ('status' in response && 'statusText' in response);
