import {
  Client,
  Directory,
} from "https://esm.sh/@dagger.io/dagger@0.9.3";

type UpOptions = {
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

export async function up({
  client,
  dir = ".",
}: UpOptions) {
  const directory = typeof dir === "string"
    ? client.host().directory(dir)
    : dir;

  await client
    .pipeline("up")
    .container()
    .from("pulumi/pulumi-nodejs")
    .withDirectory("/src", directory)
    .withWorkdir("/src")
    .withExec([

    ], { skipEntrypoint: true })
    .sync();
}
