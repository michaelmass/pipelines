import {
  Client,
  Container,
  Directory,
  Secret,
} from "https://esm.sh/@dagger.io/dagger@0.8.7";

type DeployOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The deploy token secret to use for dockerhub
   */
  token: Secret;
  /**
   * The container to use for the deploy
   */
  container: Container;
  /**
   * The repository to deploy to
   */
  repository: string;
  /**
   * Tags to apply to the deployed image
   */
  tags?: string[];
};

export async function deploy(
  {
    container,
    repository,
    tags = ["latest"],
  }: DeployOptions,
) {
  for (const tag of tags) {
    await container.publish(`${repository}:${tag}`);
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
