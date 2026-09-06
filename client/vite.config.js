import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/testSetup.js",
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/main.jsx", "src/testSetup.js"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
