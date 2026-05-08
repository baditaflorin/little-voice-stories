import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ProjectWorkspace } from './app/ProjectWorkspace';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectWorkspace />
    </QueryClientProvider>
  );
}
