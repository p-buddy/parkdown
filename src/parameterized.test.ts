import { describe, test, expect } from "vitest";
import { Register } from "./parameterized";

describe(Register.name, () => {
  test("register", () => {
    const register = new Register();
    register.tryStore("register=recipe(test)");
    expect(register.recipes.size).toBe(1);
    expect(register.recipes.get("test")).toBe("");

    register.tryStore("register=recipe(test2)&a=b");
    expect(register.recipes.size).toBe(2);
    expect(register.recipes.get("test2")).toBe("a=b");

    register.tryStore("register=recipe(test3)&c=d&register=recipe(test4)&e=f");
    expect(register.recipes.size).toBe(4);
    expect(register.recipes.get("test3")).toBe("c=d&e=f");
  });

  test("apply", () => {
    const params = new Register();
    params.recipes.set("test", "a=b");
    params.recipes.set("test2", "c=d&e=f");
    expect(params.apply("apply=recipe(test)&x=y&apply=recipe(test2)")).toBe("a=b&x=y&c=d&e=f");
  });

  test("dual", () => {
    const register = new Register();
    register.tryStore("register=recipe(test)&a=b");
    register.tryStore("register=recipe(test2)&c=d&e=f");
    expect(register.apply("apply=recipe(test)&x=y&apply=recipe(test2)")).toBe("a=b&x=y&c=d&e=f");
  })
});