// Shared source-reference helper. Kept in one place so every data module builds
// source records the same way and generated pages can rely on the shape.
export const source = (title, url) => ({title, url});
