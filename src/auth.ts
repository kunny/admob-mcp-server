/**
 * Copyright 2025 Taeho Kim <jyte82@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from "fs";
import path from "path";
import http from "http";
import url from "url";
import open from "open";
import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

const CREDENTIALS_DIR = process.env.CREDENTIALS_DIR || path.join(process.cwd(), "credentials");

const CLIENT_SECERT_PATH = path.join(CREDENTIALS_DIR, "client_secret.json");
const TOKEN_PATH = path.join(CREDENTIALS_DIR, "token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/admob.readonly",
  "https://www.googleapis.com/auth/admob.report",
];

interface ClientSecret {
  installed?: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
  web?: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
    javascript_origins: string[];
  };
}

interface Token {
  type: string;
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export async function authorize(): Promise<OAuth2Client> {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    tokenPath: TOKEN_PATH,
  });
  if (client) {
    await saveCredentials(client);
    return client;
  }
  throw new Error("Authentication failed.");
}

export async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
  try {
    const content: string = fs.readFileSync(TOKEN_PATH, "utf-8");
    const credentials = JSON.parse(content) as Token;
    return google.auth.fromJSON(credentials) as OAuth2Client;
  } catch {
    return null;
  }
}

async function saveCredentials(client: OAuth2Client): Promise<void> {
  const content: string = fs.readFileSync(CLIENT_SECERT_PATH, "utf-8");
  const keys = JSON.parse(content) as ClientSecret;
  const key = keys.installed || keys.web;
  if (!key) {
    throw new Error("No client secrets found in client_secret.json");
  }
  const payload: string = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  fs.writeFileSync(TOKEN_PATH, payload);
}

function authenticate(options: { scopes: string[]; tokenPath: string }): Promise<OAuth2Client> {
  return new Promise((resolve, reject) => {
    const content: string = fs.readFileSync(CLIENT_SECERT_PATH, "utf-8");
    const keys = JSON.parse(content) as ClientSecret;
    const key = keys.installed || keys.web;
    if (!key) {
      return reject(new Error("No client secrets found in client_secret.json"));
    }

    const oAuth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      `http://localhost:3000/oauth2callback`
    );

    const authorizeUrl: string = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: options.scopes.join(" "),
    });

    const httpServer = http
      .createServer(async (req, res) => {
        try {
          if (req.url && req.url.includes("/oauth2callback")) {
            const qs = new url.URL(req.url, "http://localhost:3000").searchParams;
            res.end("Authentication successful! Please return to the console.");
            httpServer.close();
            const code = qs.get("code");
            if (code) {
              const { tokens } = await oAuth2Client.getToken(code);
              oAuth2Client.setCredentials(tokens);
              resolve(oAuth2Client);
            } else {
              reject(new Error("No code found in callback URL"));
            }
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        open(authorizeUrl, { wait: false }).then(cp => cp.unref());
      });
  });
}
