import fs from "node:fs";
import * as easy_as_set from "./index";

const yamlContent = fs.readFileSync("./example.yaml", "utf-8");
const content = easy_as_set.parseContent(yamlContent);
console.log(content);

const MainASSet = new easy_as_set.ASSetObject("AS-EXAMPLE", "INTERNAL");
const contentUUID = MainASSet.register(content);
console.log("Registered Content UUID:", contentUUID);

await MainASSet.makePatch(contentUUID);
console.log("Generated Patch:", MainASSet.patchList);

MainASSet.applyPatches();
console.log("AS-EXAMPLE after applying patches:");
console.log(MainASSet.toRPSL());

console.log("AS-EXAMPLE have AS47778? ", MainASSet.content.has(47778));
