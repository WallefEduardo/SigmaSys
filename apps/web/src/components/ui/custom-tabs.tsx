"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";

interface Tab {
	id: string;
	label: string;
	content: React.ReactNode;
}

interface CustomTabsProps {
	tabs: Tab[];
	defaultTab?: string;
	className?: string;
}

export function CustomTabs({ tabs, defaultTab, className }: CustomTabsProps) {
	const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

	const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

	return (
		<div className={cn("w-full", className)}>
			{/* Tab Headers */}
			<div className="relative">
				<div className="flex space-x-8 border-b border-slate-200">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"relative px-1 py-4 text-sm font-medium transition-colors duration-200",
								"focus:outline-none focus:ring-0",
								activeTab === tab.id
									? "text-blue-600"
									: "text-slate-500 hover:text-slate-700"
							)}
						>
							{tab.label}
							{/* Active tab indicator */}
							{activeTab === tab.id && (
								<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
							)}
						</button>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<div className="mt-6">
				{activeTabContent}
			</div>
		</div>
	);
}