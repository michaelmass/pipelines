import { Client, Directory, Secret } from "./dagger.ts";

// TODO! test the implementation of deploy function

type DeployNetlifyOptions = {
	/**
	 * The dagger client to use
	 */
	client: Client;
	/**
	 * The directory to use as the source for the deploy
	 */
	dir?: Directory | string;
	/**
	 * Netlify token to use for authentication
	 */
	token: Secret;
	/**
	 * The netlify site to deploy to
	 */
	site: string;
};

export async function deploy({
	client,
	dir = ".",
	token,
	site,
}: DeployNetlifyOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

	await client
		.pipeline("deploy")
		.container()
		.from("node:20-slim")
		.withExec(["npm", "install", "-g", "netlify-cli"], { skipEntrypoint: true })
		.withDirectory("/app", directory)
		.withEnvVariable("NETLIFY_SITE_ID", site)
		.withSecretVariable("NETLIFY_AUTH_TOKEN", token)
		.withExec(["netlify", "deploy", "--prod", "--dir", "/app"], {
			skipEntrypoint: true,
		})
		.sync();
}
