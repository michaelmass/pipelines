import { Client, Directory } from "./dagger.ts";

// TODO! test the implementation of upload function

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
	 * Bucket name
	 */
	bucket: string;
	/**
	 * Prefix where to upload files in bucket (upload path ex. "path/to/my/folder")
	 */
	prefix?: string;
	/**
	 * aws region
	 * @default us-east-1
	 */
	awsRegion?: string;
	/**
	 * cloudfront distribution id to invalidate (required for the input invalidateCloudfront)
	 */
	cloudfrontDistribution?: string;
	/**
	 * aws access key id
	 */
	awsAccessKeyId: string;
	/**
	 * aws secret access key
	 */
	awsSecretAccessKey: string;
};

export async function upload({
	client,
	dir = ".",
	bucket,
	prefix = "",
	awsRegion = "us-east-1",
	cloudfrontDistribution,
	awsAccessKeyId,
	awsSecretAccessKey,
}: UploadOptions) {
	const directory =
		typeof dir === "string" ? client.host().directory(dir) : dir;

	let container = client
		.pipeline("upload")
		.container()
		.from("amazon/aws-cli")
		.withEnvVariable("AWS_ACCESS_KEY_ID", awsAccessKeyId)
		.withEnvVariable("AWS_SECRET_ACCESS_KEY", awsSecretAccessKey)
		.withEnvVariable("AWS_REGION", awsRegion)
		.withDirectory("/src", directory)
		.withWorkdir("/src")
		.withExec(
			["aws", "s3", "sync", ".", `s3://${bucket}/${prefix}`, "--delete"],
			{ skipEntrypoint: true },
		);

	if (cloudfrontDistribution) {
		container = container.withExec(
			[
				"aws",
				"cloudfront",
				"create-invalidation",
				"--distribution-id",
				cloudfrontDistribution,
				"--paths",
				prefix ? `/${prefix}/*` : "/*",
			],
			{ skipEntrypoint: true },
		);
	}

	await container.sync();
}
