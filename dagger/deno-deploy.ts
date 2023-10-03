import { Client, Secret } from "https://esm.sh/@dagger.io/dagger@0.8.7";

type DeployOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The directory to use as the source for the deploy
   * @default .
   */
  dir?: string;
  /**
   * Whether or not to deploy to production
   * @default true
   */
  prod?: boolean;
  /**
   * The deno deploy project name
   */
  project: string
  /**
   * The deno deploy token secret
   */
  deployToken: Secret;
  /**
   * The entrypoint to use for the deploy
   * @default main.ts
   */
  entrypoint?: string;
}

export async function denoDeploy({ client, dir = ".", prod = true, project, entrypoint = "main.ts", deployToken }: DeployOptions) {
  const directory = client.host().directory(dir)

  await client
    .pipeline("deploy")
    .container()
    .from("denoland/deno")
    .withSecretVariable("DENO_DEPLOY_TOKEN", deployToken)
    .withDirectory("/src", directory)
    .withWorkdir("/src")
    .withExec(["deno", "install", "-Arf", "https://deno.land/x/deploy/deployctl.ts"], { skipEntrypoint: true })
    .withExec(["deployctl", "deploy", `--project=${project}`, prod ? "--prod" : "", entrypoint], { skipEntrypoint: true })
    .sync();
}
