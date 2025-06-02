import type { Client, Directory, Secret } from "./dagger.ts";

const wranglerImage = "michaelmass/wrangler:0.0.4";

type UploadOptions = {
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
	 * The name of the project you want to deploy to
	 */
	project: string;
	/**
	 * The name of the branch you want to deploy to
	 */
	branch?: string;
	/**
	 * The SHA to attach to this deployment
	 */
	commitHash?: string;
	/**
	 * The commit message to attach to this deployment
	 */
	commitMessage?: string;
	/**
	 * Whether or not the workspace should be considered dirty for this deployment
	 */
	commitDirty?: boolean;
	/**
	 * Cloudflare API token
	 */
	cloudflareToken: Secret;
	/**
	 * Cloudflare account ID
	 */
	accountId: Secret;
};

export async function upload({
	client,
	dir = ".",
	project,
	cloudflareToken,
	accountId,
	branch,
	commitHash,
	commitMessage,
	commitDirty,
}: UploadOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

	const exec = [
		"wrangler",
		"pages",
		"deploy",
		".",
		"--project-name",
		project,
		branch ? "--branch" : undefined,
		branch || undefined,
		commitHash ? "--commit-hash" : undefined,
		commitHash || undefined,
		commitMessage ? "--commit-message" : undefined,
		commitMessage || undefined,
		commitDirty ? "--commit-dirty" : undefined,
	].filter((v) => v !== undefined) as string[];

	await client
		.container()
		.from(wranglerImage)
		.withSecretVariable("CLOUDFLARE_ACCOUNT_ID", accountId)
		.withSecretVariable("CLOUDFLARE_API_TOKEN", cloudflareToken)
		.withDirectory("/src", directory)
		.withWorkdir("/src")
		.withExec(exec)
		.sync();
}

type WhoAmIOptions = {
	/**
	 * The dagger client to use
	 */
	client: Client;
	/**
	 * Cloudflare API token
	 */
	cloudflareToken: Secret;
	/**
	 * Cloudflare account ID
	 */
	accountId: Secret;
};

export async function whoami({
	client,
	cloudflareToken,
	accountId,
}: WhoAmIOptions) {
	await client
		.container()
		.from(wranglerImage)
		.withSecretVariable("CLOUDFLARE_ACCOUNT_ID", accountId)
		.withSecretVariable("CLOUDFLARE_API_TOKEN", cloudflareToken)
		.withExec(["wrangler", "whoami"])
		.sync();
}
