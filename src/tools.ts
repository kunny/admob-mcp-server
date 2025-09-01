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
  GENERATE_NETWORK_REPORT = "generate_network_report",
  GENERATE_MEDIATION_REPORT = "generate_mediation_report",
  GET_ACCOUNT = "get_account",
  LIST_AD_UNITS = "list_ad_units",
  LIST_APPS = "list_apps",
}

enum Dimension {
  DATE = "DATE",
  MONTH = "MONTH",
  WEEK = "WEEK",
  AD_SOURCE = "AD_SOURCE",
  AD_SOURCE_INSTANCE = "AD_SOURCE_INSTANCE",
  AD_UNIT = "AD_UNIT",
  APP = "APP",
  MEDIATION_GROUP = "MEDIATION_GROUP",
  AD_TYPE = "AD_TYPE",
  COUNTRY = "COUNTRY",
  FORMAT = "FORMAT",
  PLATFORM = "PLATFORM",
  MOBILE_OS_VERSION = "MOBILE_OS_VERSION",
  GMA_SDK_VERSION = "GMA_SDK_VERSION",
  APP_VERSION_NAME = "APP_VERSION_NAME",
  SERVING_RESTRICTION = "SERVING_RESTRICTION",
}

enum Metric {
  AD_REQUESTS = "AD_REQUESTS",
  CLICKS = "CLICKS",
  ESTIMATED_EARNINGS = "ESTIMATED_EARNINGS",
  IMPRESSIONS = "IMPRESSIONS",
  IMPRESSION_CTR = "IMPRESSION_CTR",
  IMPRESSION_RPM = "IMPRESSION_RPM",
  MATCHED_REQUESTS = "MATCHED_REQUESTS",
  MATCH_RATE = "MATCH_RATE",
  SHOW_RATE = "SHOW_RATE",
  OBSERVED_ECPM = "OBSERVED_ECPM",
}

enum SortOrder {
  ASCENDING = "ASCENDING",
  DESCENDING = "DESCENDING",
}

const COMMON_REPORT_DIMENSIONS = [
  Dimension.DATE,
  Dimension.MONTH,
  Dimension.WEEK,
  Dimension.AD_UNIT,
  Dimension.APP,
  Dimension.AD_TYPE,
  Dimension.COUNTRY,
  Dimension.FORMAT,
  Dimension.PLATFORM,
  Dimension.MOBILE_OS_VERSION,
  Dimension.GMA_SDK_VERSION,
  Dimension.APP_VERSION_NAME,
  Dimension.SERVING_RESTRICTION,
];

const COMMON_REPORT_METRICS = [
  Metric.AD_REQUESTS,
  Metric.CLICKS,
  Metric.ESTIMATED_EARNINGS,
  Metric.IMPRESSIONS,
  Metric.IMPRESSION_CTR,
  Metric.MATCHED_REQUESTS,
  Metric.MATCH_RATE,
];

/** https://developers.google.com/admob/api/reference/rest/v1/accounts.networkReport/generate#dimension */
const NETWORK_REPORT_DIMENSIONS = [...COMMON_REPORT_DIMENSIONS, Dimension.AD_TYPE];

/** https://developers.google.com/admob/api/reference/rest/v1/accounts.networkReport/generate#metric */
const NETWORK_REPORT_METRICS = [...COMMON_REPORT_METRICS, Metric.IMPRESSION_RPM, Metric.SHOW_RATE];

/** https://developers.google.com/admob/api/reference/rest/v1/accounts.mediationReport/generate#dimension */
const MEDIATION_REPORT_DIMENSIONS = [
  ...COMMON_REPORT_DIMENSIONS,
  Dimension.AD_SOURCE,
  Dimension.AD_SOURCE_INSTANCE,
  Dimension.MEDIATION_GROUP,
];

/** https://developers.google.com/admob/api/reference/rest/v1/accounts.mediationReport/generate#metric */
const MEDIATION_REPORT_METRICS = [...COMMON_REPORT_METRICS, Metric.OBSERVED_ECPM];

export function configureTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: ToolName.GENERATE_NETWORK_REPORT,
          description:
            "Generates an AdMob Network report based on the provided report specification.",
          inputSchema: {
            type: "object",
            properties: {
              dateRangeStart: {
                type: "string",
                description: "The start date of the report. Format: YYYY-MM-DD",
                format: "date",
              },
              dateRangeEnd: {
                type: "string",
                description: "The end date of the report. Format: YYYY-MM-DD",
                format: "date",
              },
              dimensions: {
                type: "array",
                description:
                  "List of dimensions of the report. The value combination of these dimensions determines the row of the report. If no dimensions are specified, the report returns a single row of requested metrics for the entire account.",
                items: {
                  type: "string",
                  enum: NETWORK_REPORT_DIMENSIONS,
                },
              },
              dimensionFilters: {
                type: "array",
                description:
                  "Describes which report rows to match based on their dimension values.",
                items: {
                  type: "object",
                  properties: {
                    dimension: {
                      type: "string",
                      description: "Applies the filter criterion to the specified dimension.",
                      enum: NETWORK_REPORT_DIMENSIONS,
                    },
                    values: {
                      type: "array",
                      description:
                        "Matches a row if its value for the specified dimension is in one of the values specified in this condition.",
                      items: {
                        type: "string",
                      },
                    },
                  },
                  required: ["dimension", "values"],
                },
              },
              dimensionSortCondition: {
                type: "object",
                description: "Specifies the sorting condition for dimensions.",
                properties: {
                  dimension: {
                    type: "string",
                    description: "The dimension to sort by.",
                    enum: NETWORK_REPORT_DIMENSIONS,
                  },
                  order: {
                    type: "string",
                    enum: [SortOrder.ASCENDING, SortOrder.DESCENDING],
                  },
                },
                required: ["dimension", "order"],
              },
              metrics: {
                type: "array",
                description:
                  "List of metrics of the report. A report must specify at least one metric.",
                items: {
                  type: "string",
                  enum: NETWORK_REPORT_METRICS,
                },
              },
              metricSortCondition: {
                type: "object",
                description: "Specifies the sorting condition for metrics.",
                properties: {
                  metric: {
                    type: "string",
                    description: "The metric to sort by.",
                    enum: NETWORK_REPORT_METRICS,
                  },
                  order: {
                    type: "string",
                    enum: [SortOrder.ASCENDING, SortOrder.DESCENDING],
                  },
                },
                required: ["metric", "order"],
              },
            },
            required: ["dateRangeStart", "dateRangeEnd", "metrics"],
          },
        },
        {
          name: ToolName.GENERATE_MEDIATION_REPORT,
          description:
            "Generates an AdMob Mediation report based on the provided report specification.",
          inputSchema: {
            type: "object",
            properties: {
              dateRangeStart: {
                type: "string",
                description: "The start date of the report. Format: YYYY-MM-DD",
                format: "date",
              },
              dateRangeEnd: {
                type: "string",
                description: "The end date of the report. Format: YYYY-MM-DD",
                format: "date",
              },
              dimensions: {
                type: "array",
                description:
                  "List of dimensions of the report. The value combination of these dimensions determines the row of the report. If no dimensions are specified, the report returns a single row of requested metrics for the entire account.",
                items: {
                  type: "string",
                  enum: MEDIATION_REPORT_DIMENSIONS,
                },
              },
              dimensionFilters: {
                type: "array",
                description:
                  "Describes which report rows to match based on their dimension values.",
                items: {
                  type: "object",
                  properties: {
                    dimension: {
                      type: "string",
                      description: "Applies the filter criterion to the specified dimension.",
                      enum: MEDIATION_REPORT_DIMENSIONS,
                    },
                    values: {
                      type: "array",
                      description:
                        "Matches a row if its value for the specified dimension is in one of the values specified in this condition.",
                      items: {
                        type: "string",
                      },
                    },
                  },
                  required: ["dimension", "values"],
                },
              },
              dimensionSortCondition: {
                type: "object",
                description: "Specifies the sorting condition for dimensions.",
                properties: {
                  dimension: {
                    type: "string",
                    description: "The dimension to sort by.",
                    enum: MEDIATION_REPORT_DIMENSIONS,
                  },
                  order: {
                    type: "string",
                    enum: [SortOrder.ASCENDING, SortOrder.DESCENDING],
                  },
                },
                required: ["dimension", "order"],
              },
              metrics: {
                type: "array",
                description:
                  "List of metrics of the report. A report must specify at least one metric.",
                items: {
                  type: "string",
                  enum: MEDIATION_REPORT_METRICS,
                },
              },
              metricSortCondition: {
                type: "object",
                description: "Specifies the sorting condition for metrics.",
                properties: {
                  metric: {
                    type: "string",
                    description: "The metric to sort by.",
                    enum: MEDIATION_REPORT_METRICS,
                  },
                  order: {
                    type: "string",
                    enum: [SortOrder.ASCENDING, SortOrder.DESCENDING],
                  },
                },
                required: ["metric", "order"],
              },
            },
            required: ["dateRangeStart", "dateRangeEnd", "metrics"],
          },
        },
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

    if (name === ToolName.GENERATE_NETWORK_REPORT || name === ToolName.GENERATE_MEDIATION_REPORT) {
      const args = request.params.arguments;
      if (!args) {
        return {
          content: [
            {
              type: "text",
              text: "No arguments provided.",
            },
          ],
          isError: true,
        };
      }

      // Required parameters
      const dateRangeStart = args.dateRangeStart as string;
      const dateRangeEnd = args.dateRangeEnd as string;
      const metrics = args.metrics as string[];

      // Optional parameters
      const dimensions = args.dimensions as string[];
      const dimensionFilters = args.dimensionFilters as {
        dimension: string;
        values: string[];
      }[];
      const dimensionSortCondition = args.dimensionSortCondition as {
        dimension: string;
        order: SortOrder;
      };
      const metricSortCondition = args.metricSortCondition as {
        metric: string;
        order: SortOrder;
      };

      const [sYear, sMonth, sDay] = dateRangeStart.split("-").map(Number);
      const [eYear, eMonth, eDay] = dateRangeEnd.split("-").map(Number);

      if (!dateRangeStart || !dateRangeEnd || !metrics) {
        return {
          content: [
            {
              type: "text",
              text: "Missing required parameters.",
            },
          ],
          isError: true,
        };
      }

      const reportSpec: { [key: string]: unknown } = {
        dateRange: {
          startDate: {
            year: sYear,
            month: sMonth,
            day: sDay,
          },
          endDate: {
            year: eYear,
            month: eMonth,
            day: eDay,
          },
        },
        metrics: metrics,
      };

      if (dimensions && dimensions.length > 0) {
        reportSpec.dimensions = dimensions;
      }

      if (dimensionFilters && Object.keys(dimensionFilters).length > 0) {
        reportSpec.dimensionFilters = dimensionFilters.map(filter => {
          return {
            dimension: filter.dimension,
            matchesAny: {
              values: filter.values,
            },
          };
        });
      }

      if (
        (dimensionSortCondition && Object.keys(dimensionSortCondition).length > 0) ||
        (metricSortCondition && Object.keys(metricSortCondition).length > 0)
      ) {
        const sortConditions: (
          | { metric: string; order: SortOrder }
          | { dimension: string; order: SortOrder }
        )[] = [];

        if (
          dimensionSortCondition &&
          dimensionSortCondition.dimension.length > 0 &&
          dimensionSortCondition.order.length > 0
        ) {
          sortConditions.push({
            dimension: dimensionSortCondition.dimension,
            order: dimensionSortCondition.order,
          });
        }

        if (
          metricSortCondition &&
          metricSortCondition.metric.length > 0 &&
          metricSortCondition.order.length > 0
        ) {
          sortConditions.push({
            metric: metricSortCondition.metric,
            order: metricSortCondition.order,
          });
        }

        if (sortConditions.length > 0) {
          reportSpec.sortConditions = sortConditions;
        }
      }

      const reportParams = {
        parent: `accounts/${publisherCode}`,
        requestBody: {
          reportSpec: reportSpec,
        },
      };

      console.error(`Spec: ${JSON.stringify(reportSpec)}`);

      const result =
        name === ToolName.GENERATE_NETWORK_REPORT
          ? await admob.accounts.networkReport.generate(reportParams)
          : await admob.accounts.mediationReport.generate(reportParams);

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
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

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
