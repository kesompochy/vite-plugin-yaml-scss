import YamlScssPlugin from "../src/index";
import { Plugin } from "vite";
import path from "path";

describe("YamlScssPlugin", () => {
  let plugin: Plugin;
  let load: Function;
  let resolveId: Function;
  beforeEach(() => {
    plugin = YamlScssPlugin();
    load = plugin.load! as Function;
    resolveId = plugin.resolveId! as Function;
  });
  describe("resolveId", () => {
    it("should return yaml?scss file id when source is yaml and importer is scss", () => {
      const importerPath = "path/to/some_file.scss";
      const result = resolveId(
        path.resolve(__dirname, "./variables.yaml"),
        importerPath
      );
      expect(result).toBe(
        path.resolve(__dirname, "./variables.yaml") + "?scss"
      );
    });
    it("should return yaml?js file id when source is yaml and importer is not scss", () => {
      const importerPath = "path/to/some_file.ts";
      const result = resolveId(
        path.resolve(__dirname, "./variables.yaml"),
        importerPath
      );
      expect(result).toBe(path.resolve(__dirname, "./variables.yaml") + "?js");
    });
    it("should return undefined when source is not yaml", () => {
      const importerPath = "path/to/some_file.scss";
      const result = resolveId(
        path.resolve(__dirname, "./variables.ts"),
        importerPath
      );
      expect(result).toBeUndefined();
    });
  });

  describe("load", () => {
    it("should return translated JSON export file when source is yaml?js", () => {
      const result = load(path.resolve(__dirname, "./variables.yaml") + "?js");
      const variables = {
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
      };
      expect(result).toBe(`export default ${JSON.stringify(variables)};`);
    });
    it("should return translated SCSS file when source is yaml?scss", () => {
      const result = load(
        path.resolve(__dirname, "./variables.yaml") + "?scss"
      );
      expect(result).toBe(
        "$primaryColor: #000000;\n$secondaryColor: #ffffff;\n"
      );
    });
    it("should return undefined when load non-yaml file", () => {
      const result = load(path.resolve(__dirname, "./variables.ts"));
      expect(result).toBeUndefined();
    });
  });
});
