import {
  Client,
  Directory,
  Secret,
} from "https://esm.sh/@dagger.io/dagger@0.9.3";

type DeployOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The directory to use as the source for the deploy
   * @default .
   */
  dir?: string | Directory;
  /**
   * Whether or not to deploy to production
   * @default true
   */
  prod?: boolean;
  /**
   * The deno deploy project name
   */
  project: string;
  /**
   * The deno deploy token secret
   */
  deployToken: Secret;
  /**
   * The entrypoint to use for the deploy
   * @default main.ts
   */
  entrypoint?: string;
};

export async function deploy(
  {
    client,
    dir = ".",
    prod = true,
    project,
    entrypoint = "main.ts",
    deployToken,
  }: DeployOptions,
) {
  const directory = typeof dir === "string"
    ? client.host().directory(dir)
    : dir;

  const container = await client
    .pipeline("deploy")
    .container()
    .from("denoland/deno")
    .withSecretVariable("DENO_DEPLOY_TOKEN", deployToken)
    .withDirectory("/src", directory)
    .withWorkdir("/src")
    .withExec([
      "deno",
      "install",
      "-Arf",
      "https://deno.land/x/deploy/deployctl.ts",
    ], { skipEntrypoint: true })
    .withExec([
      "deployctl",
      "deploy",
      `--project=${project}`,
      prod ? "--prod" : "",
      entrypoint,
    ], { skipEntrypoint: true })
    .sync();

  return container;
}

type LintOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The directory to use as the source for the deploy
   * @default .
   */
  dir?: string | Directory;
};

export async function lint({ client, dir = "." }: LintOptions) {
  const directory = typeof dir === "string"
    ? client.host().directory(dir)
    : dir;

  const container = await client
    .pipeline("lint")
    .container()
    .from("denoland/deno")
    .withDirectory("/src", directory)
    .withWorkdir("/src")
    .withExec(["deno", "lint"], { skipEntrypoint: true })
    .sync();

  return container;
}

type FmtOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The directory to use as the source for the deploy
   * @default .
   */
  dir?: string | Directory;
};

export async function fmt({ client, dir = "." }: FmtOptions) {
  const directory = typeof dir === "string"
    ? client.host().directory(dir)
    : dir;

  const container = await client
    .pipeline("fmt")
    .container()
    .from("denoland/deno")
    .withDirectory("/src", directory)
    .withWorkdir("/src")
    .withExec(["deno", "fmt", "--check"], { skipEntrypoint: true })
    .sync();

  return container;
}
