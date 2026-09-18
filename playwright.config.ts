import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./tests',testMatch:'**/*.spec.ts',fullyParallel:false,workers:1,
 use:{baseURL:'http://127.0.0.1:4173/istoc-b2b-backlog/',channel:'chrome',headless:true},
 webServer:{command:'pnpm exec vite --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173/istoc-b2b-backlog/',reuseExistingServer:true},
 reporter:'list',outputDir:'test-results',
})
