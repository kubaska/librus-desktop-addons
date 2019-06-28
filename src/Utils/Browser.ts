export function isFirefox() {
    return navigator.userAgent.indexOf("Firefox") != -1;
}

export function isChrome() {
    return navigator.userAgent.match(/Chrom(e|ium)/g);
}
