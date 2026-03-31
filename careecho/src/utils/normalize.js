export function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

export function tokens(text) {
    return new Set(normalize(text).split(" ").filter(Boolean))
}