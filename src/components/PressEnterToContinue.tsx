import { Text } from '@anthropic/ink';
import * as React from 'react';

export function PressEnterToContinue(): React.ReactNode {
  return (
    <Text color="permission">
      Press <Text bold>Enter</Text> to continue…
    </Text>
  );
}
