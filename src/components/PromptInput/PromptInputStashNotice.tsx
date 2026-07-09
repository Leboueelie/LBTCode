import { Box, Text } from '@anthropic/ink';
import figures from 'figures';
import * as React from 'react';

type Props = {
  hasStash: boolean;
};

export function PromptInputStashNotice({ hasStash }: Props): React.ReactNode {
  if (!hasStash) {
    return null;
  }

  return (
    <Box paddingLeft={2}>
      <Text dimColor>{figures.pointerSmall} Stashed (auto-restores after submit)</Text>
    </Box>
  );
}
