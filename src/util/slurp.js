export default async function slurp(stream) {
	let arr = [],
		len = 0;
	for await (let chunk of stream) {
		arr.push(chunk);
		len += chunk.length;
	}
	return Buffer.concat(arr, len).toString();
}
