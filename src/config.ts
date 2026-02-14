export interface Config {
  apiUrl: string;
  username?: string;
  password?: string;
  token?: string;
}

export function loadConfig(): Config {
  const apiUrl = process.env.OPENDOCK_API_URL || "https://neutron.opendock.com";
  const username = process.env.OPENDOCK_USERNAME;
  const password = process.env.OPENDOCK_PASSWORD;
  const token = process.env.OPENDOCK_TOKEN;

  if (!token && (!username || !password)) {
    throw new Error(
      "Either OPENDOCK_TOKEN or both OPENDOCK_USERNAME and OPENDOCK_PASSWORD must be set"
    );
  }

  return { apiUrl, username, password, token };
}
