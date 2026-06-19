const { uuid } = require("expo-modules-core");

function getRandomValues(array) {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  let offset = 0;

  while (offset < bytes.length) {
    const randomHex = uuid.v4().replace(/-/g, "");
    for (let byteIndex = 0; byteIndex < 16 && offset < bytes.length; byteIndex += 1) {
      // UUID version and variant bytes contain fixed bits, so exclude them.
      if (byteIndex === 6 || byteIndex === 8) {
        continue;
      }
      const hexIndex = byteIndex * 2;
      bytes[offset] = Number.parseInt(randomHex.slice(hexIndex, hexIndex + 2), 16);
      offset += 1;
    }
  }

  return array;
}

module.exports = {
  ensureSecure() {
    uuid.v4();
  },
  get subtle() {
    return globalThis.crypto?.subtle;
  },
  getRandomValues,
};
