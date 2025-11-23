"use client";

import { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";
import { useMyOffer } from "@/entities/offer/useMyOffer";
import { useSaveOffer } from "@/entities/offer/useSaveOffer";

type QuillInstance = {
	root: HTMLDivElement;
	getSelection: (focus?: boolean) => { index: number } | null;
	insertEmbed: (index: number, type: string, value: unknown, source?: string) => void;
	on: (event: string, handler: () => void) => void;
};

export function OfferForm() {
	const myOfferQuery = useMyOffer();
	const saveOffer = useSaveOffer();

	const formRef = useRef<HTMLFormElement>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const editorRef = useRef<HTMLDivElement>(null);
	const quillInstanceRef = useRef<QuillInstance | null>(null);
	const seededRef = useRef(false);

	useEffect(() => {
		if (quillInstanceRef.current) return;
		(async () => {
			const QuillCtor = (await import("quill")).default as unknown as new (el: Element, options: unknown) => QuillInstance;
			const maybeToolbar = (editorRef.current as HTMLDivElement)?.previousElementSibling;
			if (maybeToolbar && maybeToolbar.classList.contains("ql-toolbar")) {
				maybeToolbar.remove();
			}

			const uploadImage = async (file: File): Promise<string> => {
				const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
				const form = new FormData();
				form.append("image", file);
				const res = await fetch(`${base}/uploads/db`, {
					method: "POST",
					body: form,
					credentials: "include",
				});
				if (!res.ok) throw new Error("Upload failed");
				const data = await res.json();
				const url: string = data.url.startsWith("http") ? data.url : `${base}${data.url}`;
				return url;
			};

			const quill = new QuillCtor(editorRef.current as HTMLDivElement, {
				theme: "snow",
				modules: {
					toolbar: {
						container: [
							["bold", "italic", "underline"],
							[{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
							[{ header: 1 }, { header: 2 }],
							[{ list: "ordered" }, { list: "bullet" }],
							["link", "image"],
							["clean"],
						],
						handlers: {
							image: function (this: unknown) {
								const input = document.createElement("input");
								input.setAttribute("type", "file");
								input.setAttribute("accept", "image/*");
								input.click();
								input.onchange = async () => {
									if (!input.files || !input.files[0]) return;
									try {
										const url = await uploadImage(input.files[0]);
										const range = quill.getSelection(true);
										quill.insertEmbed(range ? range.index : 0, "image", url, "user");
									} catch (e) {
										console.error(e);
										setError("Nie udało się wgrać obrazu.");
									}
								};
							},
						},
					},
				},
				placeholder: "Krótki opis oferty, rich text, obrazki, linki…",
			});
			quillInstanceRef.current = quill;
			if (myOfferQuery.data?.descriptionHtml) {
				quill.root.innerHTML = myOfferQuery.data.descriptionHtml;
			}
		})();
		return () => {
			const maybeToolbar = (editorRef.current as HTMLDivElement)?.previousElementSibling;
			if (maybeToolbar && maybeToolbar.classList.contains("ql-toolbar")) {
				maybeToolbar.remove();
			}
			quillInstanceRef.current = null;
		};
	}, []);

	useEffect(() => {
		const quill = quillInstanceRef.current;
		const html = myOfferQuery.data?.descriptionHtml ?? "";
		if (!quill) return;
		if (seededRef.current) return;
		if (html && html.length > 0) {
			quill.root.innerHTML = html;
			seededRef.current = true;
		}
	}, [myOfferQuery.data?.descriptionHtml]);

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const fd = new FormData(e.currentTarget);
			const title = String(fd.get("title") ?? "").trim();
			const pricePlnStr = String(fd.get("pricePln") ?? "0");
			const primaryColor = String(fd.get("primaryColor") ?? "#2563eb");
			const secondaryColor = String(fd.get("secondaryColor") ?? "#0ea5e9");
			const storeName = String(fd.get("storeName") ?? "");
			const slugify = (input: string) =>
				(input || "")
					.trim()
					.toLowerCase()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-+|-+$/g, "") || "sklep";
			const storeSlugToSave = storeName ? slugify(storeName) : (myOfferQuery.data?.storeSlug || "sklep");
			const payload = {
				storeSlug: storeSlugToSave,
				title: title.trim(),
				descriptionHtml: quillInstanceRef.current ? quillInstanceRef.current.root.innerHTML : myOfferQuery.data?.descriptionHtml ?? "",
				pricePln: Number(pricePlnStr || 0),
				primaryColor,
				secondaryColor,
			};
			await saveOffer.mutateAsync(payload);
		} catch {
		} finally {
			setSaving(false);
		}
	}

	function handleCopyAddress() {
		if (!formRef.current) return;
		const slugify = (input: string) =>
			(input || "")
				.trim()
				.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "") || "sklep";
		const fd = new FormData(formRef.current);
		const currName = String(fd.get("storeName") ?? "");
		const slugForUrl = currName ? slugify(currName) : (myOfferQuery.data?.storeSlug || "sklep");
		if (typeof window !== "undefined") {
			const url = `${window.location.origin}/${slugForUrl}`;
			navigator.clipboard?.writeText(url);
		}
	}

	function handlePreview() {
		const slugForUrl = myOfferQuery.data?.storeSlug || "sklep";
		if (typeof window !== "undefined") {
			const url = `${window.location.origin}/${slugForUrl}`;
			window.open(url, "_blank", "noopener,noreferrer");
		}
	}

	return (
		<form
			onSubmit={onSubmit}
			ref={formRef}
			className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[calc(100vh-180px)] overflow-y-auto"
		>

			<div className="mt-1 flex items-center gap-2">
				<label className="text-sm font-medium text-slate-700">Adres sklepu</label>
				<input
					name="storeName"
					defaultValue={myOfferQuery.data?.storeSlug ?? ""}
					className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400"
					placeholder="nazwa-sklepu"
				/>
				<button
					type="button"
					onClick={handleCopyAddress}
					className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 shadow-sm"
				>
					Kopiuj
				</button>
				<button
					type="button"
					onClick={handlePreview}
					className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-medium shadow-sm transition-colors"
				>
					Podgląd
				</button>
			</div>

			<div className="mt-4 grid gap-4">
				<div className="grid gap-1.5">
					<label className="text-sm font-medium text-slate-700">Kolor główny</label>
					<div className="flex items-center gap-3">
						<input
							type="color"
							defaultValue={myOfferQuery.data?.primaryColor ?? "#2563eb"}
							onInput={(e) => {
								const textEl = (e.currentTarget.parentElement?.querySelector('input[type="text"][data-primary="1"]') as HTMLInputElement | null);
								if (textEl) textEl.value = (e.currentTarget as HTMLInputElement).value;
							}}
							className="h-9 w-16 cursor-pointer"
							title={myOfferQuery.data?.primaryColor ?? "#2563eb"}
						/>
						<input
							type="text"
							name="primaryColor"
							data-primary="1"
							defaultValue={myOfferQuery.data?.primaryColor ?? "#2563eb"}
							onInput={(e) => {
								const colorEl = (e.currentTarget.parentElement?.querySelector('input[type="color"]') as HTMLInputElement | null);
								if (colorEl) colorEl.value = (e.currentTarget as HTMLInputElement).value;
							}}
							className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
						/>
					</div>
				</div>
				<div className="grid gap-1.5">
					<label className="text-sm font-medium text-slate-700">Kolor dodatkowy</label>
					<div className="flex items-center gap-3">
						<input
							type="color"
							defaultValue={myOfferQuery.data?.secondaryColor ?? "#0ea5e9"}
							onInput={(e) => {
								const textEl = (e.currentTarget.parentElement?.querySelector('input[type="text"][data-secondary="1"]') as HTMLInputElement | null);
								if (textEl) textEl.value = (e.currentTarget as HTMLInputElement).value;
							}}
							className="h-9 w-16 cursor-pointer"
							title={myOfferQuery.data?.secondaryColor ?? "#0ea5e9"}
						/>
						<input
							type="text"
							name="secondaryColor"
							data-secondary="1"
							defaultValue={myOfferQuery.data?.secondaryColor ?? "#0ea5e9"}
							onInput={(e) => {
								const colorEl = (e.currentTarget.parentElement?.querySelector('input[type="color"]') as HTMLInputElement | null);
								if (colorEl) colorEl.value = (e.currentTarget as HTMLInputElement).value;
							}}
							className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
						/>
					</div>
				</div>
				<div className="grid gap-1.5">
					<label htmlFor="offer-title" className="text-sm font-medium text-slate-700">
						Tytuł
					</label>
					<input
						id="offer-title"
						name="title"
						defaultValue={myOfferQuery.data?.title ?? ""}
						required
						className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400"
						placeholder="Nazwa oferty"
					/>
				</div>
				<div className="grid gap-1.5">
					<label className="text-sm font-medium text-slate-700">Opis</label>
					<div className="rounded-md border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 shadow-sm">
						<div ref={editorRef} className="min-h-[240px] max-h-[50vh] overflow-y-auto px-3 py-2" />
					</div>
				</div>
				<div className="grid gap-1.5">
					<label htmlFor="offer-price" className="text-sm font-medium text-slate-700">
						Cena (PLN)
					</label>
					<input
						id="offer-price"
						type="number"
						min="0"
						step="0.01"
						name="pricePln"
						defaultValue={myOfferQuery.data ? String(myOfferQuery.data.pricePln) : ""}
						required
						className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400"
						placeholder="199.00"
					/>
				</div>
			</div>
			{error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
			<div className="mt-4">
				<button
					type="submit"
					disabled={saving}
					className="inline-flex items-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
				>
					{saving ? "Zapisywanie..." : "Zapisz ofertę"}
				</button>
			</div>

		</form>
	);
}


