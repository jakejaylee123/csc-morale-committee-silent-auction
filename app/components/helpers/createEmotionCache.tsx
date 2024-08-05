import createCache from "@emotion/cache";

export const createEmotionCache = function () {
    return createCache({ 
        key: "css",
        prepend: true
    });
}