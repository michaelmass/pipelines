import type { Client, Directory } from './dagger.ts'

const biomeImage = 'michaelmass/biome:0.0.5'

type LintOptions = {
  /**
   * The dagger client to use
   */
  client: Client
  /**
   * The directory to use as the source for the lint
   * @default .
   */
  dir?: string | Directory
}

export async function lint({ client, dir = '.' }: LintOptions) {
  const directory = typeof dir === 'string' ? client.host().directory(dir) : dir

  const container = await client.container().from(biomeImage).withDirectory('/src', directory).withWorkdir('/src').withExec(['biome', 'lint', './']).sync()

  return container
}

type FmtOptions = {
  /**
   * The dagger client to use
   */
  client: Client
  /**
   * The directory to use as the source for the format
   * @default .
   */
  dir?: string | Directory
}

export async function fmt({ client, dir = '.' }: FmtOptions) {
  const directory = typeof dir === 'string' ? client.host().directory(dir) : dir

  const container = await client.container().from(biomeImage).withDirectory('/src', directory).withWorkdir('/src').withExec(['biome', 'format', './']).sync()

  return container
}

type CheckOptions = {
  /**
   * The dagger client to use
   */
  client: Client
  /**
   * The directory to use as the source for the check
   * @default .
   */
  dir?: string | Directory
}

export async function check({ client, dir = '.' }: CheckOptions) {
  const directory = typeof dir === 'string' ? client.host().directory(dir) : dir

  const container = await client.container().from(biomeImage).withDirectory('/src', directory).withWorkdir('/src').withExec(['biome', 'check', './']).sync()

  return container
}
