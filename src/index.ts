import type { Plugin } from "vite";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";

const convertYamlToScss = (yamlContent: string) => {
  const variables = yaml.load(yamlContent) as Object;
  let scssVars = "";
  for (const [key, value] of Object.entries(variables)) {
    scssVars += `$${key}: ${value};\n`;
  }
  return scssVars;
};

const YamlScssPlugin = (): Plugin => {
  return {
    name: "vite-plugin-yaml-ts-scss",
    enforce: "pre",
    resolveId(source, importer) {
      if (source.endsWith(".yaml")) {
        const resolvedPath = path.resolve(path.dirname(importer || ""), source);
        if (importer?.endsWith(".scss")) {
          return `${resolvedPath}?scss`;
        } else {
          return `${resolvedPath}?js`;
        }
      }
    },

    load(id) {
      if (id.endsWith(".yaml?scss") || id.endsWith(".yaml?js")) {
        const actualId = id.includes("?scss")
          ? id.slice(0, -5)
          : id.slice(0, -3);
        const yamlContent = fs.readFileSync(actualId, "utf8");
        if (id.endsWith(".yaml?scss")) {
          return convertYamlToScss(yamlContent);
        } else {
          const jsContent = JSON.stringify(yaml.load(yamlContent));
          return `export default ${jsContent};`;
        }
      }
    },
  };
};

export default YamlScssPlugin;

const preprocessorOptions = {
  scss: {
    importer(url: string, prev: string) {
      if (url.endsWith(".yaml")) {
        const absPath = path.resolve(path.dirname(prev), url);
        if (fs.existsSync(absPath)) {
          const yamlContent = fs.readFileSync(absPath, "utf8");
          return { contents: convertYamlToScss(yamlContent) };
        }
      }
      return null;
    },
  },
};

export { preprocessorOptions };
