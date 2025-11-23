"use client";

import { ConsultantSidebar } from "@/components/ConsultantSidebar";

export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="h-screen w-screen overflow-hidden bg-white text-slate-900 grid grid-cols-[240px_1fr]">
			<ConsultantSidebar />
			<main className="bg-dots h-full max-h-screen overflow-y-auto p-0 box-border">
				{children}
			</main>
		</div>
	);
}


