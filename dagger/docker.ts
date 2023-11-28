import {
  Client,
  Container,
  Directory,
  Secret,
} from "https://esm.sh/@dagger.io/dagger@0.9.3";

type PublishOptions = {
  /**
   * The container to use for the publish
   */
  container: Container;
  /**
   * The repository to publish to
   */
  repository: string;
  /**
 * The username to login with
 */
  username: string;
  /**
   * The password to login with
   */
  password: Secret;
  /**
   * Tags to apply to the published image
   */
  tags?: string[];
};

export async function publish(
  {
    container,
    repository = "docker.io",
    tags = ["latest"],
    username,
    password,
  }: PublishOptions,
) {
  if (!tags.length) {
    throw new Error("Failed to publish no tags provided");
  }

  for (const tag of tags) {
    await container
      .withRegistryAuth(repository, username, password)
      .publish(`${repository}:${tag}`);
  }
}

type BuildOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The directory (context) to use as the source for the docker build
   */
  dir?: string | Directory;
  /**
   * The dockerfile to use for the build
   */
  dockerfile?: string;
};

export async function build(
  {
    client,
    dir = ".",
    dockerfile = "Dockerfile",
  }: BuildOptions,
) {
  const directory = typeof dir === "string"
    ? client.host().directory(dir)
    : dir;

  const container = await client
    .pipeline("build")
    .container()
    .build(directory, { dockerfile })
    .sync();

  return container;
}
