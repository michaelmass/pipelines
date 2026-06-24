import type { Config } from './.ghf.type'

export default {
  extends: ['@ghf/default.json'],
  rules: [
    {
      type: 'merge',
      content: '{"deno.enablePaths": ["dagger"]}',
      path: '.vscode/settings.json',
      mergeArrays: true,
    }
  ]
} satisfies Config
