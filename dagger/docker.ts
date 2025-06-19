import type { Client, Container, Directory, Platform, Secret } from './dagger.ts'

type PublishOptions = {
  /**
   * The container to use for the publish
   */
  container: Container
  /**
   * The repository to publish to
   */
  repository: string
  /**
   * The username to login with
   */
  username: string
  /**
   * The password to login with
   */
  password: Secret
  /**
   * Tags to apply to the published image
   */
  tags?: string[]
  /**
   * The platform variants to publish
   */
  platformVariants?: Container[]
}

export async function publish({ container, repository = 'docker.io', tags = ['latest'], username, password, platformVariants }: PublishOptions) {
  if (!tags.length) {
    throw new Error('Failed to publish no tags provided')
  }

  for (const tag of tags) {
    await container.withRegistryAuth(repository, username, password).publish(`${repository}:${tag}`, { platformVariants })
  }
}

type BuildOptions = {
  /**
   * The dagger client to use
   */
  client: Client
  /**
   * The directory (context) to use as the source for the docker build
   */
  dir?: string | Directory
  /**
   * The dockerfile to use for the build
   */
  dockerfile?: string
  /**
   * The platform to build for
   */
  platform?: 'linux/amd64' | 'linux/arm64' | 'linux/arm64/v7' | Platform
}

export async function build({ client, dir = '.', dockerfile = 'Dockerfile', platform = 'linux/amd64' }: BuildOptions) {
  const directory = typeof dir === 'string' ? client.host().directory(dir) : dir

  const container = await client
    .container({ platform: platform as Platform })
    .build(directory, { dockerfile })
    .sync()

  return container
}
