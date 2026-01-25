import { IRR } from "..";
import * as asSet from ".";

const asSetContent = new asSet.ASSetContent();

console.log("ASSetContent initialized with members:", asSetContent.members);

asSetContent.add(
	new asSet.ASSetMember("AS12345", "RADB" as IRR.Source, ["Initial member"]),
);
console.log("\nASSetContent after adding a member:", asSetContent.members);

asSetContent.add(
	new asSet.ASSetMember("AS67890", "RIPE" as IRR.Source, ["Second member"]),
);
console.log(
	"\nASSetContent after adding another member:",
	asSetContent.members,
);

asSetContent.delete(new asSet.ASSetMember("AS12345", "RADB" as IRR.Source));
console.log("\nASSetContent after deleting a member:", asSetContent.members);

console.log(
	"\nDoes ASSetContent have AS67890?",
	asSetContent.has(new asSet.ASSetMember("AS67890", "RIPE" as IRR.Source)),
);

const anotherAsSetContent = new asSet.ASSetContent();
anotherAsSetContent.add(new asSet.ASSetMember("AS67890", "RIPE" as IRR.Source));
anotherAsSetContent.add(
	new asSet.ASSetMember("AS54321", "APNIC" as IRR.Source),
);
console.log("\nAnother ASSetContent members:", anotherAsSetContent.members);

console.log(
	"\nAre the two ASSetContents equal?",
	asSetContent.isEqual(anotherAsSetContent),
);

const difference = asSetContent.difference(anotherAsSetContent);
console.log("\nDifference between the two ASSetContents:", difference.members);

const union = asSetContent.union(anotherAsSetContent);
console.log("\nUnion of the two ASSetContents:", union.members);

union.descriptions = ["Union of two AS_SET contents"];
union.remarks = ["This is a union AS_SET"];

union.add(
	new asSet.ASSetMember("AS99999", "ARIN" as IRR.Source, [
		"Added to union AS_SET",
	]),
);

console.log(
	"\nRPSL representation of the union ASSetContent:\n\n" + union.toRPSL(),
);

// Testing ASSetRecord
const asSetRecord = new asSet.ASSetRecord(
	"AS-EXAMPLE",
	"RADB" as IRR.Source,
	union,
	[{ name: "MAINT-ASSET", source: "RADB" as IRR.Source, remarks: ["Maintainer for AS-EXAMPLE"] }],
);

console.log(
	"\nRPSL representation of the ASSetRecord:\n\n" + asSetRecord.toRPSL(),
);
