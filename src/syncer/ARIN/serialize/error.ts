import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "",
	textNodeName: "#text",
	removeNSPrefix: true,
});

export const resolveErrorMessage = (
	xmlData: string,
): {
	errorCode: string;
	errorMessage: string;
} => {
	const parsedData = parser.parse(xmlData);
	return {
		errorCode: parsedData.error.code,
		errorMessage: parsedData.error.message,
	};
};
