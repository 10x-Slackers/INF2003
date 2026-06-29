import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-alias-loader.mjs", pathToFileURL(`${import.meta.dirname}/`));
