import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:false,workers:1,retries:0,
  outputDir:'./docs/shared/validation/test-results',
  reporter:[['list'],['html',{open:'never',outputFolder:'docs/shared/validation/playwright-report'}]],
  use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:5173',channel:process.env.PW_CHANNEL||undefined,trace:'retain-on-failure'},
  webServer:process.env.PW_EXTERNAL_SERVER ? undefined : [
    {command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:false,
      env:{VITE_SUPABASE_URL:'https://workshop-test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_workshop_test_key'}},
    {command:'npm run dev --workspace=frontend -- --port 5174',url:'http://127.0.0.1:5174',reuseExistingServer:false,
      env:{VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:''}},
  ],
});
