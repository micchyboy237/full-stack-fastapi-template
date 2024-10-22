import { expect, test as base } from "@playwright/test"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser, logOutUser, signUpNewUser } from "./utils/user"

const tabs = ["My profile", "Password", "Appearance"]

// Define a custom test fixture with increased timeout
const test = base.extend({
  signedInPage: async ({ page }, use) => {
    const fullName = "Test User"
    const email = randomEmail()
    const password = randomPassword()

    try {
      console.log("Starting signedInPage fixture")
      // Sign up a new user
      await signUpNewUser(page, fullName, email, password)

      // Log in the user
      await logInUser(page, email, password)

      // Store credentials in page context
      page.context().email = email
      page.context().password = password

      await use(page)
    } catch (error) {
      console.error("Error in signedInPage fixture:", error)
      // Capture a screenshot for debugging
      // await page.screenshot({ path: `signedin-error-${Date.now()}.png` })
      throw error
    }
  },
}, { timeout: 120000 }) // Increase timeout to 120 seconds

// Replace the beforeEach hook with the custom fixture
// test.beforeEach(async ({ signedInPage }) => {
  // The page is already signed in, no need to do anything here
// })

// User Information

test("My profile tab is active by default", async ({ signedInPage: page }) => {
  await page.goto("/settings")
  await expect(page.getByRole("tab", { name: "My profile" })).toHaveAttribute(
    "aria-selected",
    "true",
  )
})

test("All tabs are visible", async ({ signedInPage: page }) => {
  await page.goto("/settings")
  for (const tab of tabs) {
    await expect(page.getByRole("tab", { name: tab })).toBeVisible()
  }
})

test.describe("Edit user full name and email successfully", () => {
  test("Edit user name with a valid name", async ({ signedInPage: page }) => {
    const updatedName = "Test User 2"

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("User updated successfully")).toBeVisible()
    // Check if the new name is displayed on the page
    await expect(
      page.getByLabel("My profile").getByText(updatedName, { exact: true }),
    ).toBeVisible()
  })

  test("Edit user email with a valid email", async ({ signedInPage: page }) => {
    const updatedEmail = randomEmail()

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(updatedEmail)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("User updated successfully")).toBeVisible()
    await expect(
      page.getByLabel("My profile").getByText(updatedEmail, { exact: true }),
    ).toBeVisible()
  })
})

test.describe("Edit user with invalid data", () => {
  test("Edit user email with an invalid email", async ({ signedInPage: page }) => {
    const invalidEmail = ""

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(invalidEmail)
    await page.locator("body").click()
    await expect(page.getByText("Email is required")).toBeVisible()
  })

  test("Cancel edit action restores original name", async ({ signedInPage: page }) => {
    const updatedName = "Test User 2"

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Full name").fill(updatedName)
    await page.getByRole("button", { name: "Cancel" }).first().click()
    await expect(
      page.getByLabel("My profile").getByText(page.context().email, { exact: true }),
    ).toBeVisible()
  })

  test("Cancel edit action restores original email", async ({ signedInPage: page }) => {
    const updatedEmail = randomEmail()

    await page.goto("/settings")
    await page.getByRole("tab", { name: "My profile" }).click()
    await page.getByRole("button", { name: "Edit" }).click()
    await page.getByLabel("Email").fill(updatedEmail)
    await page.getByRole("button", { name: "Cancel" }).first().click()
    await expect(
      page.getByLabel("My profile").getByText(page.context().email, { exact: true }),
    ).toBeVisible()
  })
})

// Change Password

test.describe("Change password successfully", () => {
  test("Update password successfully", async ({ signedInPage: page }) => {
    const newPassword = randomPassword()

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByLabel("Current Password*").fill(page.context().password)
    await page.getByLabel("Set Password*").fill(newPassword)
    await page.getByLabel("Confirm Password*").fill(newPassword)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Password updated successfully.")).toBeVisible()

    // Update the stored password
    page.context().password = newPassword

    await logOutUser(page)

    // Check if the user can log in with the new password
    await logInUser(page, page.context().email, newPassword)
  })
})

test.describe("Change password with invalid data", () => {
  test("Update password with weak passwords", async ({ signedInPage: page }) => {
    const weakPassword = "weak"

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByLabel("Current Password*").fill(page.context().password)
    await page.getByLabel("Set Password*").fill(weakPassword)
    await page.getByLabel("Confirm Password*").fill(weakPassword)
    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible()
  })

  test("New password and confirmation password do not match", async ({
    signedInPage: page,
  }) => {
    const password = page.context().password
    const newPassword = randomPassword()
    const confirmPassword = randomPassword()

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByLabel("Current Password*").fill(password)
    await page.getByLabel("Set Password*").fill(newPassword)
    await page.getByLabel("Confirm Password*").fill(confirmPassword)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Passwords do not match")).toBeVisible()
  })

  test("Current password and new password are the same", async ({ signedInPage: page }) => {
    const password = page.context().password

    await page.goto("/settings")
    await page.getByRole("tab", { name: "Password" }).click()
    await page.getByLabel("Current Password*").fill(password)
    await page.getByLabel("Set Password*").fill(password)
    await page.getByLabel("Confirm Password*").fill(password)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(
      page.getByText("New password cannot be the same as the current one"),
    ).toBeVisible()
  })
})

// Appearance

test("Appearance tab is visible", async ({ signedInPage: page }) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()
  await expect(page.getByLabel("Appearance")).toBeVisible()
})

test("User can switch from light mode to dark mode", async ({ signedInPage: page }) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()
  await page.getByLabel("Appearance").locator("span").nth(3).click()
  const isDarkMode = await page.evaluate(() =>
    document.body.classList.contains("chakra-ui-dark"),
  )
  expect(isDarkMode).toBe(true)
})

test("User can switch from dark mode to light mode", async ({ signedInPage: page }) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()
  await page.getByLabel("Appearance").locator("span").first().click()
  const isLightMode = await page.evaluate(() =>
    document.body.classList.contains("chakra-ui-light"),
  )
  expect(isLightMode).toBe(true)
})

test("Selected mode is preserved across sessions", async ({ signedInPage: page }) => {
  await page.goto("/settings")
  await page.getByRole("tab", { name: "Appearance" }).click()
  await page.getByLabel("Appearance").locator("span").nth(3).click()

  // Verify dark mode is set
  let isDarkMode = await page.evaluate(() =>
    document.body.classList.contains("chakra-ui-dark")
  );
  expect(isDarkMode).toBe(true);

  await logOutUser(page);

  await logInUser(page, page.context().email, page.context().password);
  
  // Wait for the page to load and stabilize
  await page.waitForLoadState("networkidle");

  // Verify dark mode is still set
  isDarkMode = await page.evaluate(() =>
    document.body.classList.contains("chakra-ui-dark")
  );
  expect(isDarkMode).toBe(true);
})
