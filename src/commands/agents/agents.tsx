import * as React from 'react';
import type { ToolUseContext } from '../../Tool.js';
import { AgentsMenu } from '../../components/agents/AgentsMenu.js';
import { getTools } from '../../tools.js';
import type { LocalJSXCommandOnDone } from '../../types/command.js';

export async function call(onDone: LocalJSXCommandOnDone, context: ToolUseContext): Promise<React.ReactNode> {
  const appState = context.getAppState();
  const permissionContext = appState.toolPermissionContext;
  const tools = getTools(permissionContext);

  return <AgentsMenu tools={tools} onExit={onDone} />;
}
