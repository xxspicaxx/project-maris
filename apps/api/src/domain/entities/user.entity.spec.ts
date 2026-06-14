import { UserEntity } from "./user.entity";
import { Email } from "../value-objects/email.vo";

describe("UserEntity", () => {
  it("should create a valid user entity and enable/disable it", () => {
    const email = new Email("test@example.com");
    const user = new UserEntity(
      "user-1",
      "company-1",
      email,
      "John",
      "Doe",
      true,
      null,
      new Date(),
      new Date(),
    );

    expect(user.isActive).toBe(true);

    user.disable();
    expect(user.isActive).toBe(false);

    user.enable();
    expect(user.isActive).toBe(true);

    user.updateLastLogin();
    expect(user.lastLoginAt).not.toBeNull();
  });
});
