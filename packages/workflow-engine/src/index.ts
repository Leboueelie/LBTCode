export const WORKFLOW_TOOL_NAME = 'workflow'
export type WorkflowToolDescriptor = Record<string, never>
export function createWorkflowTool(): never {
  throw new Error('Workflow engine not available in LBTCode')
}
