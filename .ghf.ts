import type { Config } from './.ghf.type'

export default {
  extends: ['https://michaelmass.github.io/ghf/ghf.default.json'],
  rules: [
    {
      type: 'merge',
      content: '{"deno.enablePaths": ["dagger"]}',
      path: '.vscode/settings.json',
      mergeArrays: true,
    }
  ]
} satisfies Config
