# vite-plugin-yaml-ts-scss

A Vite plugin for importing YAML files as TypeScript objects or SCSS variables.

## Installation

```bash
npm install --save-dev vite-plugin-yaml-ts-scss
```

or

```bash
yarn add --save-dev vite-plugin-yaml-ts-scss
```

or

```bash
pnpm install --save-dev vite-plugin-yaml-ts-scss
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import YamlScssPlugin, { preprocessorOptions } from "vite-plugin-yaml-scss";

export default defineConfig({
  plugins: [YamlScssPlugin()],
  css: {
    preprocessorOptions: preprocessorOptions, //You need to add preprocessorOptions
  },
});
```

```yaml
// variables.yaml
width: 300
height: 400
```

```ts
// main.ts
import size from "./variables.yaml";

console.log(size.width); // 300
console.log(size.height); // 400
```

```scss
// style.scss
@use "./variables.yaml" as size;

.app {
  width: size.$width + px;
  height: size.$height + px;
}
```
