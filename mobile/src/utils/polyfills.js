// Polyfills cho React Native

// TextEncoder/TextDecoder polyfill
import 'text-encoding';

// Object.fromEntries polyfill (nếu cần)
if (!Object.fromEntries) {
    Object.fromEntries = function fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj;
        }, {});
    };
}

console.log('✅ Polyfills loaded');