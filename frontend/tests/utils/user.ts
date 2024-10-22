import { type Page, expect } from "@playwright/test"

export async function signUpNewUser(
  page: Page,
  name: string,
  email: string,
  password: string,
) {
  console.log("Starting signUpNewUser function")
  await page.goto("/signup", { waitUntil: 'networkidle' })
  console.log("Navigated to /signup")

  try {
    // Wait for the form to be visible with an increased timeout
    await page.waitForSelector('form', { state: 'visible', timeout: 30000 })
    console.log("Form is visible")

    // Use a more robust way to fill the form
    await fillFormField(page, "Full Name", name)
    await fillFormField(page, "Email", email)
    await fillFormField(page, "Password", password, { exact: true })
    await fillFormField(page, "Repeat Password", password)

    await page.getByRole("button", { name: "Sign Up" }).click()
    console.log("Clicked Sign Up button")

    await expect(
      page.getByText("Your account has been created successfully"),
    ).toBeVisible({ timeout: 30000 })
    console.log("Account created successfully")

    await page.goto("/login", { waitUntil: 'networkidle' })
    console.log("Navigated to /login")
  } catch (error) {
    console.error("Error in signUpNewUser:", error)
    // Capture a screenshot for debugging
    await page.screenshot({ path: `signup-error-${Date.now()}.png` })
    throw error
  }
}

async function fillFormField(page: Page, placeholder: string, value: string, options = {}) {
  try {
    await page.waitForSelector(`input[placeholder="${placeholder}"]`, { state: 'visible', timeout: 20000 })
    await page.fill(`input[placeholder="${placeholder}"]`, value, options)
    console.log(`Filled ${placeholder} field`)
  } catch (error) {
    console.error(`Error filling ${placeholder} field:`, error)
    throw error
  }
}

export async function logInUser(page: Page, email: string, password: string) {
  await page.goto("/login", { waitUntil: 'networkidle' })

  await fillFormField(page, "Email", email)
  await fillFormField(page, "Password", password, { exact: true })
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/", { waitUntil: 'networkidle' })
  await expect(
    page.getByText("Welcome back, nice to see you again!"),
  ).toBeVisible({ timeout: 10000 })
}

export async function logOutUser(page: Page) {
  await page.getByTestId("user-menu").click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
  await page.goto("/login", { waitUntil: 'networkidle' })
}
