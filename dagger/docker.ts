import {
  Client,
  Container,
  Directory,
  Secret,
} from "https://esm.sh/@dagger.io/dagger@0.8.7";

type DeployOptions = {
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

type LoginOptions = {
  /**
   * The username to login with
   */
  username: Secret;
  /**
   * The password to login with
   */
  password: Secret;
};

export async function login({ username, password }: LoginOptions) {
  const cmd = new Deno.Command("docker", {
    stderr: "inherit",
    stdout: "inherit",
    stdin: "piped",
    args: ["login", "-u", await username.plaintext(), "--password-stdin"],
  })

  const p = cmd.spawn();
  const writer = p.stdin.getWriter();

  await writer.write(new TextEncoder().encode(await password.plaintext()));
  await writer.close()

  const output = await p.output()

  if (output.code !== 0) {
    throw new Error("Failed to login into docker");
  }
}

export async function logout() {
  const output = await new Deno.Command("docker", { args: ["logout"] }).output()

  if (output.code !== 0) {
    throw new Error("Failed to logout from docker");
  }
}
