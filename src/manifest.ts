import { defineManifest } from '@crxjs/vite-plugin'
import packageData from '../package.json'

export default defineManifest({
  name: 'Copy Fixed Twitter URL',
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-34.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  content_scripts: [
    {
      matches: ['https://twitter.com/*', 'https://x.com/*'],
      js: ['src/contentScript/index.ts'],
    },
  ],
  web_accessible_resources: [],
  permissions: [],
  // @ts-expect-error
  browser_specific_settings: {
    gecko: {
      id: '{04a01f73-b16f-4058-9fc8-223a5633b31a}',
      strict_min_version: '48.0',
    },
  },
})
