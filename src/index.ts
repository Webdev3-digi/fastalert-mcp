#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { FastalertClient } from './FastalertClient.js';

dotenv.config({ debug: false });

// --- Config & Client ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error('Missing required environment variable: API_KEY');

const fastalertClient = new FastalertClient(API_KEY);

// --- Helper Functions ---
const respond = (data: any): { content: { type: 'text'; text: string }[] } => ({
    content: [
        {
            type: 'text',
            text: Array.isArray(data)
                ? data.map((item) => `• ${JSON.stringify(item)}`).join('\n')
                : typeof data === 'string'
                ? data
                : JSON.stringify(data, null, 2),
        },
    ],
});

const respondError = (err: unknown) => ({
    content: [
        {
            type: 'text',
            text: `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
        },
    ],
    isError: true,
});

// --- Main Server Class ---
class FastalertServer {
    private readonly server: Server;
    private readonly fastalertClient: FastalertClient;

    constructor() {
        this.fastalertClient = fastalertClient;
        this.server = new Server(
            {
                name: 'fastalert',
                version: '0.3.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.server.onerror = (err) => console.error('[MCP Error]', err);
        this.setupHandlers();

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.error('🛑 Shutting down Fastalert MCP server...');
            await this.server.close();
            process.exit(0);
        });
    }

    private setupHandlers() {
        // --- List Tools Handler ---
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'list_channels',
                    description: 'List all channels, optionally filtered by name.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'Optional channel name filter',
                            },
                        },
                    },
                },
                {
                    name: 'send_message',
                    description: 'Send a message to one or more channels.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            'channel-uuid': {
                                type: 'array',
                                description: 'Channel UUIDs to send to.',
                                items: { type: 'string', example: 'abc-cl1-xyz-123' },
                                minItems: 1,
                            },
                            title: {
                                type: 'string',
                                description: 'Message title.',
                            },
                            content: {
                                type: 'string',
                                description: 'Message body.',
                            },
                            action: {
                                type: 'string',
                                enum: ['call', 'email', 'website', 'image'],
                                description: 'Optional message action type.',
                            },
                            action_value: {
                                type: 'string',
                                description: 'Value corresponding to the action type.',
                            },
                            image: {
                                type: 'string',
                                description: 'Optional image URL or binary string.',
                            },
                        },
                        required: ['channel-uuid', 'title', 'content'],
                    },
                },
            ],
        }));

        // --- Call Tool Handler ---
        this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
            const { name, arguments: args } = req.params;

            try {
                switch (name) {
                    case 'list_channels': {
                        const query = { name: args?.name as string | undefined };
                        const results = await this.fastalertClient.searchChannelEvents(query);
                        return respond(results);
                    }

                    case 'send_message': {
                        const payload = args as {
                            'channel-uuid': string[];
                            title: string;
                            content: string;
                            action?: string;
                            action_value?: string;
                            image?: string;
                        };
                        const results = await this.fastalertClient.sendMessageEvents(payload);
                        return respond(results);
                    }

                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            } catch (err) {
                return respondError(err);
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('✅ Fastalert MCP server running on stdio');
    }
}

// --- Run Server ---
const server = new FastalertServer();
server.run().catch((err) => {
    console.error('❌ Failed to start Fastalert MCP server:', err);
    process.exit(1);
});
