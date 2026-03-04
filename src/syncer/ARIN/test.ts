import ARIN from "./arin-client";
import * as asSet from "../../core/IRR/AS_SET/index";
import * as serializerASSet from "./serialize/as-set";

const token = process.env.ARIN_API_KEY || "";
const orgHandle = "SNL-127"; // Replace with your actual organization handle

const arinClient = new ARIN(token, orgHandle);

const asSetContent = new asSet.ASSetContent();

asSetContent.descriptions?.push()
asSetContent.add(new asSet.ASSetMember("AS47778", "RADB", ["Initial member"]));

const asSetObject = new asSet.ASSetObject("AS-MITEI", "ARIN", asSetContent, [
	{
		name: orgHandle,
	},
]);

console.log(
	`AS-SET create status: ${await arinClient.createASSet(asSetObject)}`,
);
