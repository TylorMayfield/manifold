#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Release script for Manifold
 * Usage: node scripts/release.js <version>
 * Example: node scripts/release.js 1.0.0
 */

const version = process.argv[2];

if (!version) {
  console.error("❌ Please provide a version number");
  console.log("Usage: node scripts/release.js <version>");
  console.log("Example: node scripts/release.js 1.0.0");
  process.exit(1);
}

// Validate version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(version)) {
  console.error(
    "❌ Invalid version format. Use semantic versioning (e.g., 1.0.0)"
  );
  process.exit(1);
}

const tagName = `v${version}`;

console.log(`🚀 Creating release ${tagName}...`);

try {
  // Check if we're in a git repository
  execSync("git status", { stdio: "pipe" });
} catch (error) {
  console.error("❌ Not in a git repository");
  process.exit(1);
}

try {
  // Check if tag already exists
  execSync(`git tag -l "${tagName}"`, { stdio: "pipe" });
  const existingTag = execSync(`git tag -l "${tagName}"`, {
    encoding: "utf8",
  }).trim();

  if (existingTag) {
    console.error(`❌ Tag ${tagName} already exists`);
    process.exit(1);
  }
} catch (error) {
  // Tag doesn't exist, which is what we want
}

try {
  // Update package.json version
  console.log("📝 Updating package.json version...");
  const packageJsonPath = path.join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.version = version;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n"
  );

  // Stage changes
  console.log("📦 Staging changes...");
  execSync("git add package.json");

  // Commit changes
  console.log("💾 Committing version update...");
  execSync(`git commit -m "chore: bump version to ${version}"`);

  // Create tag
  console.log("🏷️  Creating git tag...");
  execSync(`git tag -a ${tagName} -m "Release ${tagName}"`);

  // Push changes and tags
  console.log("📤 Pushing to remote...");
  execSync("git push origin main");
  execSync(`git push origin ${tagName}`);

  console.log("✅ Release created successfully!");
  console.log(`🎉 Tag ${tagName} has been pushed to remote`);
  console.log(
    "🔄 GitHub Actions will now build and create the release automatically"
  );
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Wait for GitHub Actions to complete the build");
  console.log("2. Check the Releases page for your new release");
  console.log("3. Download and test the platform-specific binaries");
} catch (error) {
  console.error("❌ Error creating release:", error.message);
  process.exit(1);
}
