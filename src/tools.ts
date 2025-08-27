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

import { type admob_v1, google } from "googleapis";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadSavedCredentialsIfExist } from "./auth.js";

enum ToolName {
  GET_ACCOUNT = "get_account",
  LIST_AD_UNITS = "list_ad_units",
  LIST_APPS = "list_apps",
}

export function configureTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: ToolName.GET_ACCOUNT,
          description: "Gets information about the AdMob publisher account.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: ToolName.LIST_AD_UNITS,
          description: "List the ad units under the AdMob publisher account.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: ToolName.LIST_APPS,
          description: "List the apps under the AdMob publisher account.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async request => {
    const auth = await loadSavedCredentialsIfExist();
    if (!auth) {
      return {
        content: [
          {
            type: "text",
            text: "Not Authenticated. Try running `npm run auth` to authenticate.",
          },
        ],
        isError: true,
      };
    }

    const publisherCode = process.env.PUBLISHER_CODE;
    if (!publisherCode) {
      return {
        content: [
          {
            type: "text",
            text: "PUBLISHER_CODE environment variable not set.",
          },
        ],
        isError: true,
      };
    }

    const { name } = request.params;
    const admob = google.admob({ version: "v1", auth });

    if (name === ToolName.GET_ACCOUNT) {
      const result = await admob.accounts.get({ name: `accounts/${publisherCode}` });
      if (!result.ok) {
        return {
          content: [
            {
              type: "text",
              text: `API request failed: ${result.status}`,
            },
          ],
          isError: true,
        };
      }

      const data = result.data;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                name: data.name,
                publisherId: data.publisherId,
                reportingTimeZone: data.reportingTimeZone,
                currencyCode: data.currencyCode,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === ToolName.LIST_AD_UNITS) {
      const allAdUnits: admob_v1.Schema$AdUnit[] = [];
      let pageToken: string | undefined;

      try {
        do {
          // Make the API call, including the pageToken if it exists.
          const result = await admob.accounts.adUnits.list({
            parent: `accounts/${publisherCode}`,
            pageToken: pageToken,
          });

          // Check for a failed API request.
          if (!result.ok) {
            return {
              content: [
                {
                  type: "text",
                  text: `API request failed with status: ${result.status}`,
                },
              ],
              isError: true,
            };
          }

          const data = result.data;

          // Add the fetched apps to our list.
          if (data.adUnits && data.adUnits.length > 0) {
            allAdUnits.push(...data.adUnits);
          }

          // Update the token for the next iteration of the loop.
          pageToken = data.nextPageToken ?? undefined;
        } while (pageToken);

        // Return the complete list of apps.
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(allAdUnits, null, 2),
            },
          ],
        };
      } catch (error) {
        // Handle any unexpected errors during the process.
        return {
          content: [
            {
              type: "text",
              text: `An error occurred: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    if (name === ToolName.LIST_APPS) {
      const allApps: admob_v1.Schema$App[] = [];
      let pageToken: string | undefined;

      try {
        do {
          // Make the API call, including the pageToken if it exists.
          const result = await admob.accounts.apps.list({
            parent: `accounts/${publisherCode}`,
            pageToken: pageToken,
          });

          // Check for a failed API request.
          if (!result.ok) {
            return {
              content: [
                {
                  type: "text",
                  text: `API request failed with status: ${result.status}`,
                },
              ],
              isError: true,
            };
          }

          const data = result.data;

          // Add the fetched apps to our list.
          if (data.apps && data.apps.length > 0) {
            allApps.push(...data.apps);
          }

          // Update the token for the next iteration of the loop.
          pageToken = data.nextPageToken ?? undefined;
        } while (pageToken);

        // Return the complete list of apps.
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(allApps, null, 2),
            },
          ],
        };
      } catch (error) {
        // Handle any unexpected errors during the process.
        return {
          content: [
            {
              type: "text",
              text: `An error occurred: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }

    throw new Error(`Unknown tool: ${name}`);
  });
}
