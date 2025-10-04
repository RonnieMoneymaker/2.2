/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  use: {
    baseURL: 'http://localhost:5050',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure'
  },
  reporter: [['list']]
};

export default config;



