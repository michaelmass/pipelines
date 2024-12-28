import { stringify } from "https://deno.land/std@0.221.0/yaml/mod.ts";
import { type Client, File } from "./dagger.ts";

type DeployHelmOptions = {
	/**
	 * The dagger client to use
	 */
	client: Client;
	/**
	 * Chart name to use for deployment
	 */
	chart: string;
	/**
	 * Release name to use for the deployment
	 */
	release: string;
	/**
	 * Namespace to deploy the chart to
	 */
	namespace: string;
	/**
	 * Values file to use for the deployment
	 */
	values: string | Record<string, unknown> | File;
	/**
	 * Repository to use for the deployment
	 */
	repository: string;
	/**
	 * Version of the chart to deploy
	 */
	version: string;
	/**
	 * Atomic flag for the deployment
	 */
	atomic?: boolean;
	/**
	 * Create namespace flag for the deployment
	 */
	createNamespace?: boolean;
	/**
	 * Cleanup on fail flag for the deployment
	 */
	cleanupOnFail?: boolean;
	/**
	 * Max history for the deployment
	 */
	maxHistory?: number;
	/**
	 * Timeout for the deployment in seconds
	 */
	timeout?: number;
	/**
	 * Kubeconfig file to use for the deployment or the content of the kubeconfig file
	 */
	kubeconfig: string | File;
};

export async function deploy({
	client,
	maxHistory = 10,
	kubeconfig,
	namespace,
	chart,
	release,
	values,
	repository,
	version,
	atomic = true,
	cleanupOnFail = true,
	createNamespace = false,
	timeout = 300,
}: DeployHelmOptions) {
	const kubeconfigPath = "/deploy/kubeconfig";
	const valuesPath = "/deploy/values.yaml";

	const kubeconfigFile =
		typeof kubeconfig === "string"
			? client
					.directory()
					.withNewFile(kubeconfigPath, kubeconfig)
					.file(kubeconfigPath)
			: kubeconfig;

	const valuesFile =
		values instanceof File
			? values
			: client
					.directory()
					.withNewFile(
						valuesPath,
						values === "string" ? values : stringify(values),
					)
					.file(valuesPath);

	const exec = [
		"helm",
		"upgrade",
		release,
		chart,
		"--install",
		"--timeout",
		`${timeout.toString()}s`,
		"--version",
		version,
		"--repo",
		repository,
		"--namespace",
		namespace,
		"--kubeconfig",
		kubeconfigPath,
		"--history-max",
		maxHistory.toString(),
		"--values",
		valuesPath,
		atomic ? "--atomic" : undefined,
		cleanupOnFail ? "--cleanup-on-fail" : undefined,
		createNamespace ? "--create-namespace" : undefined,
	].filter((v) => v !== undefined) as string[];

	await client
		.pipeline("deploy")
		.container()
		.from("alpine/helm:3.16.4")
		.withFile(kubeconfigPath, kubeconfigFile)
		.withFile(valuesPath, valuesFile)
		.withExec(exec, { skipEntrypoint: true })
		.sync();
}
