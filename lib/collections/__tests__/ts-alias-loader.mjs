import { existsSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = process.cwd();

function tsUrl(path) {
  return pathToFileURL(path.endsWith(".ts") ? path : `${path}.ts`).href;
}

export function resolve(specifier, context, nextResolve) {
  if (specifier === "@/lib/db") {
    return {
      shortCircuit: true,
      url: tsUrl(resolvePath(root, "lib/collections/__tests__/mocks/db")),
    };
  }

  if (specifier.startsWith("@/")) {
    return {
      shortCircuit: true,
      url: tsUrl(resolvePath(root, specifier.slice(2))),
    };
  }

  if (specifier.startsWith(".") && context.parentURL) {
    const path = resolvePath(
      dirname(fileURLToPath(context.parentURL)),
      specifier,
    );
    if (!specifier.endsWith(".ts") && existsSync(`${path}.ts`)) {
      return { shortCircuit: true, url: tsUrl(path) };
    }
  }

  return nextResolve(specifier, context);
}
