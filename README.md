# MCP Server for FastAlert

A Model Context Protocol server that provides tools for discovering channels with optional search by name through the FastAlert API.

## Features

- Search for channels:
  - Name search
- Send Messages:
  - channel-uuid
  - Title
  - Content
  - action
  - action_value
  - image

## Configuration

The server requires a FastAlert API key. You can get one by
1. Going to https://fastalert.now/
2. Creating an account or signing in
3. Going to "Settings" in your account
4. Get your API key

Set your API key in your MCP settings file:

```json
{
  "mcpServers": {
    "fastalert-mcp": {
      "command": "node",
      "args": [
        "/path-to-project/fastalert-mcp-server/build/index.js"
      ],
      "env": {
        "BASE_URL":"https://apialert.testflight.biz/api/v1",
        "API_KEY":"your-api-key"
      }
    }
  }
}
```

## Usage

The server provides a tool called `list_channels` that accepts:

### Optional Parameters
- `name`: Search term
### Examples

#### Structured JSON Output (Default)
```
<use_mcp_tool>
<server_name>fastalert</server_name>
<tool_name>list_channels</tool_name>
<arguments>
{
  "uuid": "sdf12sdf-6541-5d56-s5sd-1fa513e88a87",
  "name": "my channels",
  "subscriber": "1000"
}
</arguments>
</use_mcp_tool>
```

#### Human-Readable Text Output
```
<use_mcp_tool>
<server_name>fastalert</server_name>
<tool_name>list_channels</tool_name>
<arguments>
{
  "uuid": "sdf12sdf-6541-5d56-s5sd-1fa513e88a87",
  "name": "my channels",
  "subscriber": "1000"
}
</arguments>
</use_mcp_tool>
```

## Development

1. Clone the repository
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Add your FastAlert API key to `.env`
4. Install dependencies:
   ```bash
   npm install
   ```
5. Build the project:
   ```bash
   npm run build
   ```
6. Test with the inspector:
   ```bash
   npm run inspector
   ```