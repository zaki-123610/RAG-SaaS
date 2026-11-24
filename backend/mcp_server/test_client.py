import asyncio
import os
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "mcp_server.server"],
    )
    async with stdio_client(params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            await session.initialize()

            tools = await session.list_tools()
            print("Outils :")
            for t in tools.tools:
                print(" -", t.name, ":", t.description)

            result = await session.call_tool(
                "search_documents",
                {"bot_id": os.environ["EVAL_BOT_ID"], "query": "modele ARMA"},
            )
            print("\nsearch_documents ->\n", result.content[0].text[:500])


asyncio.run(main())