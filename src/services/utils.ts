import fetch, { RequestInfo } from 'node-fetch';

function partitionArray<T>(array: readonly T[], partitionSize: number): readonly T[][] {
	const workingCopy: T[] = [...array];
	const result: T[][] = [];
	while (workingCopy.length) {
		result.push(workingCopy.splice(0, partitionSize));
	}
	return result;
}

async function http(request: RequestInfo): Promise<any> {
	return new Promise(resolve => {
		fetch(request)
			.then(
				response => {
					// console.log('received response, reading text body');
					return response.text();
				},
				error => {
					console.warn('could not retrieve review', error);
				},
			)
			.then(body => {
				// console.log('sending back body', body && body.length);
				resolve(body);
			});
	});
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const encode = (input: string): string => {
	// return compressToEncodedURIComponent(input);
	const buff = Buffer.from(input, 'utf-8');
	const base64 = buff.toString('base64');
	return base64;
};

const decode = (base64: string): string => {
	const buff = Buffer.from(base64, 'base64');
	const str = buff.toString('utf-8');
	return str;
};

const formatDate = (today: Date): string => {
	return `${today
		.toISOString()
		.slice(0, 19)
		.replace('T', ' ')}.${today.getMilliseconds()}`;
};

export { partitionArray, http, sleep, encode, decode, formatDate };
