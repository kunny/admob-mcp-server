# AdMob MCP Server

This is a server that exposes the Google AdMob API as a set of tools for the Model Context Protocol (MCP).

## Prerequisites

*   Node.js
*   npm

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kunny/admob-mcp-server.git
    cd admob-mcp-server
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Build the server:
    ```bash
    npm run build
    ```

## Configuration

1.  **Enable the AdMob API**

    a. Go to the [Google API Console](https://console.developers.google.com/apis/library).

    b. From the projects list, select a project or create a new one.

    c. In the API Library, search for "AdMob API".

    d. Select "AdMob API" and click the "Enable" button.

2.  **Create OAuth 2.0 Credentials**

    a. Go to the [Credentials page](https://console.developers.google.com/apis/credentials) in the Google API Console.

    b. Click "Create Credentials" and select "OAuth client ID".

    c. Select "Desktop app" for the "Application type".

    d. Enter a name for the credential (e.g., "AdMob MCP Server").

    e. Click "Create".

    f. A "Client ID" and "Client Secret" will be displayed. Click "Download JSON" to download the client secret file.

3.  **Set up the Credentials**

    a. Create a `credentials` directory in the root of the project:
    ```bash
    mkdir credentials
    ```

    b. Move the downloaded JSON file to the `credentials` directory and rename it to `client_secret.json`.

4.  **Set the Publisher Code (Optional)**

    Create a `.env` file in the root of the project and add your AdMob publisher ID:
    ```
    PUBLISHER_CODE=pub-xxxxxxxxxxxxxxxx
    ```

## Authentication

Run the following command to authenticate with your Google account:

```bash
npm run auth
```

This will open a browser window for you to log in and grant permission to the application.

After you have authenticated, a `token.json` file will be created in the `credentials` directory.

## Running the Server

To start the server, run the following command:

```bash
npm start
```

The server will be running on `stdio`.

## Available Tools

The following tools are available:

*   `get_account`: Gets information about the AdMob publisher account.
*   `list_ad_units`: Lists the ad units under the AdMob publisher account.
*   `list_apps`: Lists the apps under the AdMob publisher account.

## Usage with AI Agents

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "admob": {
      "command": "node",
      "args": [
        "{PATH_TO_SERVER}/build/index.js"
      ],
      "env": {
        "CREDENTIALS_DIR": "{PATH_TO_SERVER}/credentials",
        "PUBLISHER_CODE": "pub-xxxxxxx"
      }
    }
  }
}
```

### Usage with Gemini CLI

Add to your `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "admob": {
      "command": "node",
      "args": [
        "{PATH_TO_SERVER}/build/index.js"
      ],
      "env": {
        "CREDENTIALS_DIR": "{PATH_TO_SERVER}/credentials",
        "PUBLISHER_CODE": "pub-xxxxxxx"
      }
    }
  }
}
```

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.
