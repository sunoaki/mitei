import IRRD from ".";

const client = new IRRD({ endpoint: "https://rr.ntt.net/graphql" });

const A = await client.getASSetObject("AS-SUNOAKI", {
    sources: ["ALTDB", "ARIN"]
});

console.log(A[0].content.members);
