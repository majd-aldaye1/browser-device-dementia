import {normalize, tokens} from "./normalize";

export function matchQuestion(input, clusters) {
    const normalizedInput = normalize(input);

    for (const cluster of clusters) {
        const phrases = [cluster.canonicalQuestion, ...cluster.samplePhrasings];
        const normalizedPhrases = phrases.map(normalize);
        console.log(11);
        if (normalizedPhrases.includes(normalizedInput)) {
            return {
                cluster: cluster,
                confidence: 1.0,
                strategy: "exact"
            };
        }
    }

    const inputTokens = tokens(normalizedInput);
    let bestCluster = null;
    let bestScore = 0;

    // use jaccardi similarity: intersection/union
    //console.log(1);
    for (const cluster of clusters) {
        const normalizedPhrases = [cluster.canonicalQuestion, ...cluster.samplePhrasings].map(normalize);
        for (const phrase of normalizedPhrases) {
            const phraseTokens = tokens(phrase);
            const union = new Set([...phraseTokens, ...inputTokens]).size;
            const intersection = [...inputTokens].filter((t) => phraseTokens.has(t)).length;
            const score = union === 0 ? 0 : intersection/union;

            if (score > bestScore) {
                bestScore = score;
                bestCluster = cluster;
            }
        }
    }

    return {
        cluster: bestCluster,
        confidence: bestScore,
        strategy: "token-overlap"
    };

}