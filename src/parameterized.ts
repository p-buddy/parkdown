import { createParser, numberedParameters, type MethodDefinition } from "./api";

const registration = [
  "recipe(id: string)"
] satisfies MethodDefinition[];

const application = [
  "recipe(id: string, 0?: string, 1?: string, 2?: string)"
] satisfies MethodDefinition[];

const parsers = {
  register: createParser(registration),
  apply: createParser(application)
}

export class Register {
  recipes = new Map<string, string>();

  tryStore(fullQuery: string) {
    const entries = Register.Entries(fullQuery);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      if (key !== "register") continue;
      const parsed = parsers.register(value);
      switch (parsed.name) {
        case "recipe":
          const recipe = entries.slice(i + 1)
            .filter(([k]) => k !== "register")
            .map(([k, v]) => `${k}=${v}`)
            .join("&");
          this.recipes.set(parsed.id, recipe);
          break;
        default:
          throw new Error(`Unknown registration: ${parsed.name}`);
      }
    }
  }

  apply(fullQuery: string) {
    const entries = Register.Entries(fullQuery);
    const parts: string[] = [];
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      if (key !== "apply") {
        parts.push(`${key}=${value}`);
        continue;
      };
      const parsed = parsers.apply(value);
      switch (parsed.name) {
        case "recipe":
          parts.push(this.recipes.get(parsed.id))
          parts.push(...numberedParameters(parsed).map(id => this.recipes.get(id)));
          break;
        default:
          throw new Error(`Unknown registration: ${parsed.name}`);
      }
    }
    return parts.join("&");
  }

  private static Entries = (fullQuery: string) =>
    Array.from(new URLSearchParams(fullQuery).entries());
}