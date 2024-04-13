import type { Client, Directory, Secret } from "./dagger.ts";

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

export async function deploy({
	client,
	dir = ".",
	prod = true,
	project,
	entrypoint = "main.ts",
	deployToken,
}: DeployOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

	const container = await client
		.pipeline("deploy")
		.container()
		.from("denoland/deno")
		.withSecretVariable("DENO_DEPLOY_TOKEN", deployToken)
		.withDirectory("/src", directory)
		.withWorkdir("/src")
		.withExec(
			["deno", "install", "-Arf", "https://deno.land/x/deploy/deployctl.ts"],
			{ skipEntrypoint: true },
		)
		.withExec(
			[
				"deployctl",
				"deploy",
				`--project=${project}`,
				prod ? "--prod" : "",
				entrypoint,
			],
			{ skipEntrypoint: true },
		)
		.sync();

	return container;
}

type LintOptions = {
	/**
	 * The dagger client to use
	 */
	client: Client;
	/**
	 * The directory to use as the source for the lint
	 * @default .
	 */
	dir?: string | Directory;
};

export async function lint({ client, dir = "." }: LintOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

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
	 * The directory to use as the source for the format
	 * @default .
	 */
	dir?: string | Directory;
};

export async function fmt({ client, dir = "." }: FmtOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

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

type CheckOptions = {
	/**
	 * The dagger client to use
	 */
	client: Client;
	/**
	 * The directory to use as the source for the type check
	 * @default .
	 */
	dir?: string | Directory;
	/**
	 * The deno entrypoint to use for the type check
	 */
	entrypoints: string[];
};

export async function check({
	client,
	dir = ".",
	entrypoints = ["src/mod.ts"],
}: CheckOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

	const container = await client
		.pipeline("check")
		.container()
		.from("denoland/deno")
		.withDirectory("/src", directory)
		.withWorkdir("/src")
		.withExec(["deno", "check", ...entrypoints], { skipEntrypoint: true })
		.sync();

	return container;
}

type PublishOptions = {
	/**
	 * The dagger client to use
	 */
	client: Client;
	/**
	 * The directory to use as the source for the type check
	 * @default .
	 */
	dir?: string | Directory;
	/**
	 * The id token to use for the publish
	 */
	token?: Secret;
};

export async function publish({ client, dir = ".", token }: PublishOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

	const command = ["deno", "publish"];

	if (token) {
		command.push("--token", await token.plaintext());
	}

	let container = client
		.pipeline("publish")
		.container()
		.from("denoland/deno")
		.withDirectory("/src", directory)
		.withWorkdir("/src");

	if (!token) {
		const githubActions = Deno.env.get("GITHUB_ACTIONS") ?? "";
		const githubRepository = Deno.env.get("GITHUB_REPOSITORY") ?? "";
		const actionsIdTokenRequestUrl =
			Deno.env.get("ACTIONS_ID_TOKEN_REQUEST_URL") ?? "";
		const actionsIdTokenRequestToken =
			Deno.env.get("ACTIONS_ID_TOKEN_REQUEST_TOKEN") ?? "";

		if (
			!githubActions ||
			!actionsIdTokenRequestUrl ||
			!actionsIdTokenRequestToken ||
			!githubRepository
		) {
			throw new Error(
				"Missing GITHUB_ACTIONS, ACTIONS_ID_TOKEN_REQUEST_URL, or ACTIONS_ID_TOKEN_REQUEST_TOKEN environment variables",
			);
		}

		container = container
			.withEnvVariable("GITHUB_REPOSITORY", githubRepository)
			.withEnvVariable("GITHUB_ACTIONS", githubActions)
			.withEnvVariable("ACTIONS_ID_TOKEN_REQUEST_URL", actionsIdTokenRequestUrl)
			.withEnvVariable(
				"ACTIONS_ID_TOKEN_REQUEST_TOKEN",
				actionsIdTokenRequestToken,
			);
	}

	return container
		.withExec(command, {
			skipEntrypoint: true,
		})
		.sync();
}
