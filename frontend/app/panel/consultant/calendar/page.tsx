"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useState } from "react";
import { useConsultantClients } from "@/entities/relation/useConsultantClients";
import { useEvents } from "@/entities/event/useEvents";
import { useCreateEvent } from "@/entities/event/useCreateEvent";
import { useUpdateEventPayment } from "@/entities/event/useUpdateEventPayment";
import { useDeleteEvent } from "@/entities/event/useDeleteEvent";
import { useUpdateEvent } from "@/entities/event/useUpdateEvent";
import { useDeleteEventGroup } from "@/entities/event/useDeleteEventGroup";
import { useUpdateEventGroup } from "@/entities/event/useUpdateEventGroup";

export default function ConsultantCalendarPage() {
	const now = new Date();
	const [events, setEvents] = useState<any[]>([]);
	const [addOpen, setAddOpen] = useState(false);
	const [draftStart, setDraftStart] = useState<Date | null>(null);
	const [draftEnd, setDraftEnd] = useState<Date | null>(null);
	const [showPayments, setShowPayments] = useState(false);
	const [detailsForId, setDetailsForId] = useState<string | null>(null);
	const [editForId, setEditForId] = useState<string | null>(null);
	const [deleteSeriesFor, setDeleteSeriesFor] = useState<any | null>(null);
	const [editSeriesFor, setEditSeriesFor] = useState<any | null>(null);
	const [editSeriesFromFor, setEditSeriesFromFor] = useState<any | null>(null);
	const [movePromptFor, setMovePromptFor] = useState<{
		id: string;
		groupId: number;
		oldStart: Date;
		newStart: Date;
		newEnd: Date | null;
		revert: () => void;
	} | null>(null);
	const [editGroupContext, setEditGroupContext] = useState<{ id: string; groupId: number; fromOldStart: Date } | null>(null);
	const [pendingSeriesEdit, setPendingSeriesEdit] = useState<{
		id: string;
		groupId: number;
		fromOldStart: Date;
		newStart: Date;
		newEnd: Date;
	} | null>(null);
	const [scopePromptOpen, setScopePromptOpen] = useState(false);

	const eventsQuery = useEvents();
	const createEvent = useCreateEvent();
	const updatePayment = useUpdateEventPayment();
	const deleteEvent = useDeleteEvent();
	const updateEvent = useUpdateEvent();
	const deleteGroup = useDeleteEventGroup();
	const updateGroup = useUpdateEventGroup();

	React.useEffect(() => {
		if (!eventsQuery.data) return;
    const mapped = eventsQuery.data.map((e) => ({
			title: e.title,
			start: new Date(e.start),
			end: new Date(e.end),
      extendedProps: { id: String(e.id), paymentStatus: e.paymentStatus === "PAID" ? "paid" : "unpaid", source: e.source, eventGroupId: e.eventGroupId },
		}));
		setEvents(mapped);
	}, [eventsQuery.data]);

	return (
		<div className="bg-dots h-full max-h-screen p-6 sm:p-8 md:p-10 lg:p-12 overflow-y-auto">
			<div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-xl px-6 sm:px-8 md:px-10 lg:px-12 py-6">
					<div className="flex items-center justify-between gap-4">
						<h1 className="text-2xl font-semibold text-blue-700">Kalendarz konsultacji</h1>
						<div className="flex items-center gap-3">
							<PaymentsToggle value={showPayments} onChange={setShowPayments} />
							<button
								type="button"
								onClick={() => setAddOpen(true)}
								className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
							>
								<span className="text-base leading-none">+</span>
								Dodaj konsultacje
							</button>
						</div>
					</div>
					<div className="mt-4 border border-slate-200 rounded-xl p-3 bg-white h-[70vh] md:h-[75vh] overflow-hidden">
						<FullCalendar
							key={showPayments ? "payments-on" : "payments-off"}
							plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
							initialView="timeGridWeek"
							headerToolbar={{
								left: "prev,next today",
								center: "title",
								right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
							}}
							buttonText={{
								today: "Dziś",
								month: "Miesiąc",
								week: "Tydzień",
								day: "Dzień",
								list: "Lista",
							}}
							views={{
								listWeek: { noEventsMessage: "Brak konsultacji w tym tygodniu" },
								timeGridDay: {
									dayHeaderFormat: { weekday: "long", day: "2-digit", month: "2-digit" },
								},
							}}
							weekends
							events={events}
							editable
							selectable
							select={(selection) => {
								setDraftStart(selection.start);
								setDraftEnd(selection.end);
								setAddOpen(true);
							}}
							selectAllow={(info) => {
								const endMinusOneMs = new Date(info.end.getTime() - 1);
								const sameDay =
									info.start.getFullYear() === endMinusOneMs.getFullYear() &&
									info.start.getMonth() === endMinusOneMs.getMonth() &&
									info.start.getDate() === endMinusOneMs.getDate();
								return sameDay;
							}}
							eventClick={(arg) => {
								const id = (arg.event.extendedProps as any)?.id as string | undefined;
								if (id) setDetailsForId(id);
							}}
							eventDrop={(info) => {
								const id = (info.event.extendedProps as any)?.id as string | undefined;
								const groupId = (info.event.extendedProps as any)?.eventGroupId as number | undefined;
								const newStart = info.event.start as Date;
								const newEnd = (info.event.end as Date) ?? null;
								const oldStart = info.oldEvent.start as Date;
								if (!id) return;
								if (groupId) {
									setMovePromptFor({ id, groupId, oldStart, newStart, newEnd, revert: info.revert });
								} else {
									updateEvent.mutate(
										{ id: Number(id), start: newStart.toISOString(), end: newEnd ? newEnd.toISOString() : newStart.toISOString() },
										{ onError: () => info.revert() },
									);
								}
							}}
                            eventDidMount={(info) => {
								const BLUE = "#3b82f6";
								const RED = "#ef4444";
								const GREEN = "#22c55e";
								let bg = BLUE;
								if (showPayments) {
									const status = (info.event.extendedProps as any)?.paymentStatus as string | undefined;
									if (status === "paid") bg = GREEN;
									else if (status === "unpaid") bg = RED;
								}
                              const source = (info.event.extendedProps as any)?.source as string | undefined;
                              const toRgba = (hex: string, alpha: number) => {
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                              };
                              if (source === "AUTO") {
                                info.el.style.backgroundColor = toRgba(bg, 0.15);
                                (info.el as HTMLElement).style.border = `2px dashed ${bg}`;
                                info.el.style.color = "#2563eb";
                              } else {
                                info.el.style.backgroundColor = bg;
                                info.el.style.borderColor = bg;
                                info.el.style.color = "#ffffff";
                              }
                              const recId = (info.event.extendedProps as any)?.recordingId as number | undefined;
                              if (recId) {
                                const link = document.createElement("a");
                                link.href = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/recordings/${recId}`;
                                link.target = "_blank";
                                link.rel = "noreferrer";
                                link.textContent = "▶ Nagranie";
                                link.className = "absolute right-2 bottom-1 text-xs underline";
                                (info.el as HTMLElement).style.position = "relative";
                                info.el.appendChild(link);
                              }
							}}
							locale="pl"
							firstDay={1}
							height="100%"
							expandRows
							stickyHeaderDates
							nowIndicator
							allDaySlot={false}
							scrollTime="00:00:00"
							slotMinTime="00:00:00"
							slotMaxTime="24:00:00"
                            slotDuration="01:00:00"
                            snapDuration="01:00:00"
							selectMirror
							slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
							dayHeaderFormat={{ weekday: "short", day: "2-digit" }}
							eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
							eventOverlap={false}
							eventClassNames={() => ["fc-tailwind-event"]}
							initialDate={now}
						/>
					</div>

				{addOpen && (
					<AddConsultationModal
						initialStart={draftStart ?? now}
						initialEnd={draftEnd ?? new Date(now.getTime() + 60 * 60 * 1000)}
						onClose={() => setAddOpen(false)}
						onSave={(payload) => {
							createEvent.mutate(
								{
									title: payload.clientLabel || "Konsultacja",
									start: payload.start.toISOString(),
									end: payload.end.toISOString(),
									relationId: payload.relationId as number,
									weekly: payload.weekly,
								},
								{
									onSuccess: (created) => {
										setEvents((prev) => [
											...prev,
											{
												title: created.title,
												start: new Date(created.start),
												end: new Date(created.end),
												extendedProps: {
													id: String(created.id),
													paymentStatus: created.paymentStatus === "PAID" ? "paid" : "unpaid",
												},
											},
										]);
										setAddOpen(false);
										if (typeof window !== "undefined" && typeof document !== "undefined") {
											const el = document.createElement("div");
											el.setAttribute(
												"class",
												"fixed bottom-6 right-6 z-1000 rounded-lg border border-green-200 bg-white px-4 py-3 shadow-lg"
											);
											el.innerHTML = `<p class="text-sm font-medium" style="color:#16a34a">Wydarzenie dodano pomyślnie.</p>`;
											document.body.appendChild(el);
											window.setTimeout(() => {
												el.remove();
											}, 3000);
										}
									},
								},
							);
						}}
					/>
				)}

				{movePromptFor && (
					<EditSeriesScopeModal
						onClose={() => {
							movePromptFor.revert();
							setMovePromptFor(null);
						}}
						onScopeOne={() => {
							updateEvent.mutate(
								{
									id: Number(movePromptFor.id),
									start: movePromptFor.newStart.toISOString(),
									end: (movePromptFor.newEnd ?? movePromptFor.newStart).toISOString(),
								},
								{
									onError: () => movePromptFor.revert(),
									onSuccess: () => setMovePromptFor(null),
								},
							);
						}}
						onScopeFrom={() => {
							updateGroup.mutate(
								{
									groupId: Number(movePromptFor.groupId),
									fromOldStart: movePromptFor.oldStart.toISOString(),
									start: movePromptFor.newStart.toISOString(),
									end: (movePromptFor.newEnd ?? movePromptFor.newStart).toISOString(),
								},
								{
									onError: () => movePromptFor.revert(),
									onSuccess: () => setMovePromptFor(null),
								},
							);
						}}
					/>
				)}

				{detailsForId && (
					<EventDetailsModal
						event={events.find((e) => e.extendedProps?.id === detailsForId)}
						onClose={() => setDetailsForId(null)}
						onEdit={() => {
							const ev = events.find((e) => e.extendedProps?.id === detailsForId);
							if (ev?.extendedProps?.eventGroupId) {
								setEditGroupContext({
									id: detailsForId!,
									groupId: Number(ev.extendedProps.eventGroupId),
									fromOldStart: new Date(ev.start),
								});
							} else {
								setEditGroupContext(null);
							}
							setEditForId(detailsForId);
							setDetailsForId(null);
						}}
						onMarkPaid={() => {
							if (!detailsForId) return;
							updatePayment.mutate({ id: Number(detailsForId), status: "PAID" }, { onSuccess: () => setDetailsForId(null) });
						}}
						onMarkUnpaid={() => {
							if (!detailsForId) return;
							updatePayment.mutate({ id: Number(detailsForId), status: "UNPAID" }, { onSuccess: () => setDetailsForId(null) });
						}}
						onDelete={() => {
							if (!detailsForId) return;
							const ev = events.find((e) => e.extendedProps?.id === detailsForId);
							if (ev?.extendedProps?.eventGroupId) {
								setDeleteSeriesFor(ev);
								setDetailsForId(null);
							} else {
								deleteEvent.mutate(Number(detailsForId), { onSuccess: () => setDetailsForId(null) });
							}
						}}
						showPayments={showPayments}
					/>
				)}

				{editSeriesFor && (
					<EditSeriesScopeModal
						onClose={() => setEditSeriesFor(null)}
						onScopeOne={() => {
							setEditForId(editSeriesFor.extendedProps.id);
							setEditSeriesFor(null);
						}}
						onScopeFrom={() => {
							setEditSeriesFromFor(editSeriesFor);
							setEditSeriesFor(null);
						}}
					/>
				)}

				{editForId && (
					<EditEventModal
						event={events.find((e) => e.extendedProps?.id === editForId)}
						onClose={() => setEditForId(null)}
						onSave={({ start, end }) => {
							if (editGroupContext && editGroupContext.id === editForId) {
								setPendingSeriesEdit({
									id: editGroupContext.id,
									groupId: editGroupContext.groupId,
									fromOldStart: editGroupContext.fromOldStart,
									newStart: start,
									newEnd: end,
								});
								setEditForId(null);
								setScopePromptOpen(true);
							} else {
								updateEvent.mutate(
									{ id: Number(editForId), start: start.toISOString(), end: end.toISOString() },
									{
										onSuccess: (updated) => {
											setEvents((prev) =>
												prev.map((ev) =>
													ev.extendedProps?.id === editForId
														? { ...ev, start: new Date(updated.start as any), end: new Date(updated.end as any) }
														: ev,
												),
											);
											setEditForId(null);
										},
									},
								);
							}
						}}
					/>
				)}

				{editSeriesFromFor && (
					<EditEventModal
						event={editSeriesFromFor}
						onClose={() => setEditSeriesFromFor(null)}
						onSave={({ start, end }) => {
							updateGroup.mutate(
								{
									groupId: Number(editSeriesFromFor.extendedProps.eventGroupId),
									fromOldStart: (new Date(editSeriesFromFor.start) as Date).toISOString(),
									start: start.toISOString(),
									end: end.toISOString(),
								},
								{ onSuccess: () => setEditSeriesFromFor(null) },
							);
						}}
					/>
				)}

				{scopePromptOpen && pendingSeriesEdit && (
					<EditSeriesScopeModal
						onClose={() => {
							setScopePromptOpen(false);
							setPendingSeriesEdit(null);
						}}
						onScopeOne={() => {
							updateEvent.mutate(
								{
									id: Number(pendingSeriesEdit.id),
									start: pendingSeriesEdit.newStart.toISOString(),
									end: pendingSeriesEdit.newEnd.toISOString(),
								},
								{
									onSuccess: () => {
										setScopePromptOpen(false);
										setPendingSeriesEdit(null);
									},
								},
							);
						}}
						onScopeFrom={() => {
							updateGroup.mutate(
								{
									groupId: Number(pendingSeriesEdit.groupId),
									fromOldStart: pendingSeriesEdit.fromOldStart.toISOString(),
									start: pendingSeriesEdit.newStart.toISOString(),
									end: pendingSeriesEdit.newEnd.toISOString(),
								},
								{
									onSuccess: () => {
										setScopePromptOpen(false);
										setPendingSeriesEdit(null);
									},
								},
							);
						}}
					/>
				)}
			</div>
		{deleteSeriesFor && (
			<DeleteSeriesModal
				onClose={() => setDeleteSeriesFor(null)}
				onDeleteSingle={() => {
					deleteEvent.mutate(Number(deleteSeriesFor.extendedProps.id), { onSuccess: () => setDeleteSeriesFor(null) });
				}}
				onDeleteFrom={() => {
					deleteGroup.mutate(
						{ groupId: Number(deleteSeriesFor.extendedProps.eventGroupId), scope: "FROM", from: (deleteSeriesFor.start as Date).toISOString() },
						{ onSuccess: () => setDeleteSeriesFor(null) },
					);
				}}
				onDeleteAll={() => {
					deleteGroup.mutate(
						{ groupId: Number(deleteSeriesFor.extendedProps.eventGroupId), scope: "ALL" },
						{ onSuccess: () => setDeleteSeriesFor(null) },
					);
				}}
			/>
		)}
	</div>
);
}



function PaymentsToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
	return (
		<label className="inline-flex items-center gap-3 select-none cursor-pointer">
			<span className="text-sm text-slate-600">Pokaż status płatności</span>
			<button
				type="button"
				role="switch"
				aria-checked={value}
				onClick={() => onChange(!value)}
				className={[
					"relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
					value ? "bg-blue-600" : "bg-slate-300",
				].join(" ")}
			>
				<span
					className={[
						"inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
						value ? "translate-x-5" : "translate-x-1",
					].join(" ")}
				/>
			</button>
		</label>
	);
}

function AddConsultationModal({
	onClose,
	onSave,
	initialStart,
	initialEnd,
}: {
	onClose: () => void;
	onSave: (data: { relationId?: number; clientLabel?: string; start: Date; end: Date; weekly: boolean }) => void;
	initialStart: Date;
	initialEnd: Date;
}) {
	const { data: clients } = useConsultantClients();
	const [relationId, setRelationId] = useState<number | undefined>(undefined);
	const [day, setDay] = useState<string>(toInputDate(initialStart));
	const [startTime, setStartTime] = useState<string>(toInputTime(initialStart));
	const [endTime, setEndTime] = useState<string>(toInputTime(initialEnd));
	const [weekly, setWeekly] = useState(false);

	const clientLabel =
		clients?.find((r) => r.id === relationId)?.client
			? [clients?.find((r) => r.id === relationId)?.client.firstName, clients?.find((r) => r.id === relationId)?.client.lastName]
					.filter(Boolean)
					.join(" ")
			: undefined;

	function submit() {
		const start = mergeDateTime(day, startTime);
		const end = mergeDateTime(day, endTime);
		if (!start || !end) return onClose();
		onSave({ relationId, clientLabel, start, end, weekly });
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Zaplanuj nową konsultację</h3>
					<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
				</div>
				<div className="p-6 grid gap-4 text-sm">
					<div>
						<div className="text-xs font-medium text-slate-700 mb-1">Przypisz klienta</div>
						<select
							value={relationId ?? ""}
							onChange={(e) => setRelationId(e.target.value ? Number(e.target.value) : undefined)}
							className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						>
							<option value="">— wybierz klienta —</option>
							{(clients ?? []).map((r) => {
								const name = [r.client.firstName, r.client.lastName].filter(Boolean).join(" ").trim();
								return (
									<option key={r.id} value={r.id}>
										{name || r.client.email}
									</option>
								);
							})}
						</select>
					</div>

					<div>
						<div className="text-xs font-medium text-slate-700 mb-1">Dzień</div>
						<input
							type="date"
							value={day}
							onChange={(e) => setDay(e.target.value)}
							className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-slate-700 mb-1">Godzina rozpoczęcia</div>
							<input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-slate-700 mb-1">Godzina zakończenia</div>
							<input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
					</div>

					<label className="inline-flex items-center gap-2 select-none cursor-pointer mt-1">
						<input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} />
						<span>Konsultacja co tydzień</span>
					</label>
				</div>
				<div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
					<button onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Anuluj</button>
					<button onClick={submit} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">Zaplanuj konsultację</button>
				</div>
			</div>
		</div>
	);
}

function EditEventModal({
	event,
	onClose,
	onSave,
}: {
	event: any;
	onClose: () => void;
	onSave: (data: { start: Date; end: Date }) => void;
}) {
	if (!event) return null;
	const s = new Date(event.start);
	const e = new Date(event.end ?? s);
	const [day, setDay] = useState<string>(toInputDate(s));
	const [startTime, setStartTime] = useState<string>(toInputTime(s));
	const [endTime, setEndTime] = useState<string>(toInputTime(e));

	function submit() {
		const start = mergeDateTime(day, startTime);
		const end = mergeDateTime(day, endTime);
		if (!start || !end) return onClose();
		onSave({ start, end });
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Edytuj informacje o zajęciach</h3>
					<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
				</div>
				<div className="p-6 grid gap-4 text-sm">
					<div>
						<div className="text-xs font-medium text-slate-700 mb-1">Dzień</div>
						<input
							type="date"
							value={day}
							onChange={(e) => setDay(e.target.value)}
							className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-slate-700 mb-1">Godzina rozpoczęcia</div>
							<input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-slate-700 mb-1">Godzina zakończenia</div>
							<input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							/>
						</div>
					</div>
				</div>
				<div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
					<button onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Anuluj</button>
					<button onClick={submit} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">Potwierdź</button>
				</div>
			</div>
		</div>
	);
}

function toInputDate(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
function toInputTime(d: Date) {
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}
function mergeDateTime(date: string, time: string): Date | null {
	if (!date || !time) return null;
	const [y, m, d] = date.split("-").map(Number);
	const [hh, mm] = time.split(":").map(Number);
	const dt = new Date();
	dt.setFullYear(y);
	dt.setMonth(m - 1);
	dt.setDate(d);
	dt.setHours(hh, mm, 0, 0);
	return dt;
}

function EventDetailsModal({
	event,
	onClose,
	onEdit,
	onMarkPaid,
	onMarkUnpaid,
	onDelete,
	showPayments,
}: {
	event: any;
	onClose: () => void;
	onEdit: () => void;
	onMarkPaid: () => void;
	onMarkUnpaid: () => void;
	onDelete: () => void;
	showPayments: boolean;
}) {
	if (!event) return null;
	const title: string = event.title ?? "Konsultacja";
	const start = new Date(event.start);
	const end = new Date(event.end ?? start);
	const dateText = start.toLocaleDateString("pl-PL", {
		weekday: "long",
		day: "2-digit",
		month: "long",
	});
	const timeText =
		start.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) +
		"–" +
		end.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
	const status: "paid" | "unpaid" = event.extendedProps?.paymentStatus || "unpaid";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<span className="inline-block h-4 w-4 border-2 border-dashed border-red-500 rounded-sm" />
						<h3 className="text-2xl font-semibold">{title}</h3>
					</div>
					<div className="flex items-center gap-3">
						<button title="Edytuj" className="text-slate-500 hover:text-slate-700" onClick={onEdit}>
							✎
						</button>
						<button title="Usuń" className="text-slate-500 hover:text-red-600" onClick={onDelete}>
							🗑
						</button>
						<button onClick={onClose} title="Zamknij" className="text-slate-500 hover:text-slate-700">✕</button>
					</div>
				</div>
				<div className="p-6 grid gap-4">
					<div className="text-slate-600">
						{dateText} · {timeText}
					</div>
					<hr className="border-slate-200" />
					{showPayments && (
						<div className="pt-2">
							<div className="text-sm font-medium text-slate-700">Status płatności</div>
							{status === "paid" ? (
								<div className="mt-1 text-green-600">Opłacone</div>
							) : (
								<div className="mt-1 text-red-600">Nieopłacone</div>
							)}
							<div className="mt-1 text-sm">
								{status === "paid" ? (
									<button onClick={onMarkUnpaid} className="text-blue-700 hover:underline">
										Oznacz jako nieopłacone
									</button>
								) : (
									<button onClick={onMarkPaid} className="text-blue-700 hover:underline">
										Oznacz jako opłacone
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}


function DeleteSeriesModal({
	onClose,
	onDeleteSingle,
	onDeleteFrom,
	onDeleteAll,
}: {
	onClose: () => void;
	onDeleteSingle: () => void;
	onDeleteFrom: () => void;
	onDeleteAll: () => void;
}) {
	const [choice, setChoice] = useState<"ONE" | "FROM" | "ALL">("ONE");
	function confirm() {
		if (choice === "ONE") onDeleteSingle();
		else if (choice === "FROM") onDeleteFrom();
		else onDeleteAll();
	}
	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
			<div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Usuwanie wydarzenia cyklicznego</h3>
					<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
				</div>
				<div className="p-6 grid gap-3">
					<label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
						<input type="radio" checked={choice === "ONE"} onChange={() => setChoice("ONE")} />
						<span>To wydarzenie</span>
					</label>
					<label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
						<input type="radio" checked={choice === "FROM"} onChange={() => setChoice("FROM")} />
						<span>To wydarzenie i kolejne wydarzenia</span>
					</label>
					<label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
						<input type="radio" checked={choice === "ALL"} onChange={() => setChoice("ALL")} />
						<span>Wszystkie wydarzenia</span>
					</label>
				</div>
				<div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
					<button onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Anuluj</button>
					<button onClick={confirm} className="rounded-md bg-red-600 text-white px-4 py-2 text-sm">Usuń</button>
				</div>
			</div>
		</div>
	);
}


function EditSeriesScopeModal({
	onClose,
	onScopeOne,
	onScopeFrom,
}: {
	onClose: () => void;
	onScopeOne: () => void;
	onScopeFrom: () => void;
}) {
	const [choice, setChoice] = useState<"ONE" | "FROM">("ONE");
	function confirm() {
		if (choice === "ONE") onScopeOne();
		else onScopeFrom();
	}
	return (
		<div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
			<div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<h3 className="text-lg font-semibold">Edytowanie wydarzenia cyklicznego</h3>
					<button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
				</div>
				<div className="p-6 grid gap-3">
					<div className="text-sm text-slate-600">Zaznacz dla jakich wydarzeń mają zostać wprowadzone zmiany.</div>
					<label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
						<input type="radio" checked={choice === "ONE"} onChange={() => setChoice("ONE")} />
						<span>To wydarzenie</span>
					</label>
					<label className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer">
						<input type="radio" checked={choice === "FROM"} onChange={() => setChoice("FROM")} />
						<span>To wydarzenie i kolejne wydarzenia</span>
					</label>
				</div>
				<div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
					<button onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Anuluj</button>
					<button onClick={confirm} className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">OK</button>
				</div>
			</div>
		</div>
	);
}

