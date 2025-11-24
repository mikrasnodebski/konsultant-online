"use client";

import { OfferForm } from "./OfferForm";

export function ConsultantPanel() {
	return (
		<div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-xl mt-6 mb-6 px-6 sm:px-8 md:px-10 lg:px-12 py-6">
			<div className="">
				<header className="flex items-start">
					<div className="min-w-[280px]">
						<h1 className="text-2xl font-semibold text-blue-700">Twoja oferta konsultacji</h1>
						<p className="text-sm text-slate-500 mt-1">Skonfiguruj tytuł, opis i cenę – tak zobaczą to Twoi klienci.</p>
					</div>
				</header>

				<section className="mt-6 flex justify-center">
					<OfferForm />
				</section>
			</div>
		</div>
	);
}


