import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

enum PromptName {
  TOP_PERFORMING_APPS_LAST7D = "top_performing_apps_last7d",
  TOP_PERFORMING_AD_UNITS_LAST7D = "top_performing_ad_units_last7d",
}

export function configurePrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, () => {
    return {
      prompts: [
        {
          name: PromptName.TOP_PERFORMING_APPS_LAST7D,
          title: "Top performing apps with earnings (Last 7 days)",
          description: "List top performing apps in the last 7 days, sorted by estimated earnings.",
        },
        {
          name: PromptName.TOP_PERFORMING_AD_UNITS_LAST7D,
          title: "Top performing ad units with earnings (Last 7 days)",
          description: "List top performing ad units in the last 7 days within a specific app.",
          arguments: [
            {
              name: "admob_app_id",
              description: "AdMob app ID (e.g., ca-app-pub-3940256099942544~3347511713)",
              required: true,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, request => {
    const { name } = request.params;

    if (name === PromptName.TOP_PERFORMING_APPS_LAST7D) {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "List top performing apps with estimated earnings for all mediated networks over the last 7 days, sorted by estimated earnings.",
            },
          },
        ],
      };
    }

    if (name === PromptName.TOP_PERFORMING_AD_UNITS_LAST7D) {
      const args = request.params.arguments;
      if (!args) {
        throw new Error(`No arguments provided for prompt: ${name}`);
      }

      const appId = args.admob_app_id as string;
      if (!appId) {
        throw new Error("AdMob app ID is missing.");
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `List top performing ad units with estimated earnings for all mediated networks within the AdMob app ID ${appId} over the last 7 days, sorted by estimated earnings.`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });
}
