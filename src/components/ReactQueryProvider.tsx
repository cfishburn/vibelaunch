import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

interface ReactQueryProviderProps {
	children: ReactNode;
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
	const [queryClient] = useState(() => new QueryClient());

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
