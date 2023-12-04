import {
  Client,
  Directory,
} from "https://esm.sh/@dagger.io/dagger@0.9.3";

type InstallOptions = {
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
   * Release name
   */
  release: string;
  /**
   * Namespace
   */
  namespace?: string;
  /**
   * values file
   */
  values?: string;
};

export async function install({
  client,
  dir = ".",
  release,
  namespace = "default",
  values = "./values.yaml",
}: InstallOptions) {
  const directory = typeof dir === "string"
    ? client.host().directory(dir)
    : dir;

  return await client
    .pipeline("install")
    .container()
    .from("michaelmass/helmify")
    .withDirectory("/src", directory)
    .withWorkdir("/src")
    .withExec([
      "helm",
      "upgrade",
      release,
      ".",
      "--install",
      "--wait",
      "--atomic",
      `--namespace=${namespace}`,
      `--values=${values}`,
    ], { skipEntrypoint: true })
    .sync()
}
