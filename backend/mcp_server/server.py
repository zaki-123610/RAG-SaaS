from mcp.server.mcpserver import MCPServer

mcp = MCPServer("RAG SaaS")


@mcp.tool()
def ping() -> str:
    """Verifie que le serveur MCP repond. Retourne 'pong'."""
    return "pong"


if __name__ == "__main__":
    mcp.run(transport="stdio")