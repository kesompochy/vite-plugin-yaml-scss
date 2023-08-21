import type { Plugin } from "vite";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";

interface YamlScssPluginOptions {
  watchYaml?: boolean;
}

interface ModuleWithId {
  id: string | null;
  importers: Set<ModuleWithId>;
  clientImportedModules: Set<ModuleWithId>;
}

const convertYamlToScss = (yamlContent: string) => {
  const variables = yaml.load(yamlContent) as Record<string, any>;
  return Object.entries(variables)
    .map(([key, value]) => `$${key}: ${value};`)
    .join("\n");
};

const getAllRelatedModules = (module: ModuleWithId) => {
  const visited = new Set<string>();
  const relatedModules: ModuleWithId[] = [];

  const visit = (mod: ModuleWithId) => {
    if (!mod.id) return;
    if (!visited.has(mod.id)) {
      visited.add(mod.id);
      relatedModules.push(mod);
      mod.importers.forEach(visit);
      mod.clientImportedModules.forEach(visit);
    }
  };

  visit(module);
  return relatedModules;
};

const YamlScssPlugin = (inputOptions?: YamlScssPluginOptions): Plugin => {
  const options = {
    watchYaml: true,
    ...inputOptions,
  };

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

        if (options.watchYaml) this.addWatchFile(actualId);

        const yamlContent = fs.readFileSync(actualId, "utf8");
        if (id.endsWith(".yaml?scss")) {
          return convertYamlToScss(yamlContent);
        } else {
          const jsContent = JSON.stringify(yaml.load(yamlContent));
          return `export default ${jsContent};`;
        }
      }
    },

    async handleHotUpdate({ file, server }) {
      if (file.endsWith(".yaml")) {
        const modulesToUpdate = Array.from(
          server.moduleGraph.fileToModulesMap.get(file) || []
        );

        const relatedModules = modulesToUpdate.flatMap((module) =>
          getAllRelatedModules(module)
        );

        if (options.watchYaml) {
          relatedModules.forEach((relatedModule: any) => {
            if (relatedModule?.id?.endsWith(".scss")) {
              modulesToUpdate.push(relatedModule);
            }
          });
        }

        modulesToUpdate.forEach((mod) => {
          server.moduleGraph.invalidateModule(mod);
        });

        return modulesToUpdate;
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
