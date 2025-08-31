"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

interface NoSSRProps {
	children: ReactNode;
	fallback?: ReactNode;
}

function NoSSRComponent({ children, fallback = null }: NoSSRProps) {
	return <>{children}</>;
}

const NoSSR = dynamic(() => Promise.resolve(NoSSRComponent), {
	ssr: false,
});

export { NoSSR };
