import { Client } from "https://esm.sh/@dagger.io/dagger@0.8.7";

type GetInfinsicalOptions = {
  /**
   * The dagger client to use
   */
  client: Client;
  /**
   * The environment to get the secret store for
   * @default prod
   */
  environment?: string;
  /**
   * The workspace id to get the secret store for
   */
  workspaceId?: string;
  /**
   * Default secret path to use
   * @default /
   */
  defaultSecretPath?: string;
  /**
   * The infinsical token
   */
  token?: string;
};

export function getInfinsical({
  client,
  environment = "prod",
  token = Deno.env.get("INFISICAL_TOKEN"),
  workspaceId = Deno.env.get("INFISICAL_WORKSPACE_ID"),
  defaultSecretPath = "/",
}: GetInfinsicalOptions) {
  if (!token) {
    throw new Error("No infisical token provided");
  }

  if (!workspaceId) {
    throw new Error("No infisical workspace id provided");
  }

  return {
    get: async ({ name, secretName, secretPath }: {
      name: string;
      secretName: string;
      secretPath?: string;
    }) => {
      const value = await getInfisicalSecret({
        environment,
        token,
        name,
        workspaceId,
        secretPath: secretPath ?? defaultSecretPath,
      });

      return client.setSecret(secretName, value);
    },
  };
}

type GetInfisicalSecretOptions = {
  name: string;
  environment: string;
  workspaceId: string;
  token: string;
  secretPath: string;
};

const getInfisicalSecret = async (
  { name, environment, workspaceId, token, secretPath }:
    GetInfisicalSecretOptions,
) => {
  const response = await fetch(
    `https://app.infisical.com/api/v3/secrets/raw/${name}?environment=${environment}&workspaceId=${workspaceId}&secretPath=${secretPath.startsWith("/") ? secretPath : `/${secretPath}`
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();
  const value = data?.secret?.secretValue;

  if (typeof value !== "string") {
    throw new Error(`No secret found for ${name}`);
  }

  return value;
};
