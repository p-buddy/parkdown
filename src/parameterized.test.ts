import { describe, test, expect } from "vitest";
import { Parameters } from "./parameterized";

describe(Parameters.name, () => {
  test("register", () => {
    const params = new Parameters();
    params.tryRegister("register=recipe(test)");
    expect(params.recipes.size).toBe(1);
    expect(params.recipes.get("test")).toBe("");

    params.tryRegister("register=recipe(test2)&a=b");
    expect(params.recipes.size).toBe(2);
    expect(params.recipes.get("test2")).toBe("a=b");

    params.tryRegister("register=recipe(test3)&c=d&register=recipe(test4)&e=f");
    expect(params.recipes.size).toBe(4);
    expect(params.recipes.get("test3")).toBe("c=d&e=f");
  });

  test("apply", () => {
    const params = new Parameters();
    params.recipes.set("test", "a=b");
    params.recipes.set("test2", "c=d&e=f");
    expect(params.apply("apply=recipe(test)&x=y&apply=recipe(test2)")).toBe("a=b&x=y&c=d&e=f");
  });
});