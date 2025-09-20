#!/usr/bin/env node

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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { authorize } from "./auth.js";
import { configureTools } from "./tools.js";
import * as dotenv from "dotenv";
import { configurePrompts } from "./prompts.js";

if (process.env.DEBUG === "true") {
  dotenv.config({ quiet: true });
  console.error("Environment variables loaded from .env file");
}

const server = new Server(
  {
    name: "AdMob",
    version: "0.1.0",
  },
  {
    capabilities: {
      prompts: {},
      tools: {},
    },
  }
);

configurePrompts(server);
configureTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AdMob MCP Server running on stdio");
}

if (process.argv.includes("auth")) {
  authorize().then(() => {
    console.log("Authentication successful!");
    process.exit(0);
  });
} else {
  main().catch(error => {
    console.error(`Fatal error in main(): ${error}`);
    process.exit(1);
  });
}
