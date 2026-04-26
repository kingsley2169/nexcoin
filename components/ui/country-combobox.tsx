"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CountryComboboxProps = {
	id?: string;
	name: string;
	countries: readonly string[];
	defaultValue?: string;
	placeholder?: string;
	required?: boolean;
};

export function CountryCombobox({
	id,
	name,
	countries,
	defaultValue = "",
	placeholder = "Search country",
	required,
}: CountryComboboxProps) {
	const [value, setValue] = useState(defaultValue);
	const [query, setQuery] = useState(defaultValue);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return countries;
		return countries.filter((c) => c.toLowerCase().includes(q));
	}, [countries, query]);

	useEffect(() => {
		function onDocClick(event: MouseEvent) {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(event.target as Node)) {
				setOpen(false);
				setQuery(value);
			}
		}
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, [value]);

	useEffect(() => {
		if (!open || !listRef.current) return;
		const active = listRef.current.querySelector<HTMLLIElement>(
			`[data-index="${activeIndex}"]`,
		);
		active?.scrollIntoView({ block: "nearest" });
	}, [activeIndex, open]);

	function commit(country: string) {
		setValue(country);
		setQuery(country);
		setOpen(false);
	}

	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setOpen(true);
			setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			if (open && filtered[activeIndex]) {
				e.preventDefault();
				commit(filtered[activeIndex]);
			}
		} else if (e.key === "Escape") {
			setOpen(false);
		}
	}

	return (
		<div ref={containerRef} className="relative">
			<input
				id={id}
				type="text"
				role="combobox"
				aria-expanded={open}
				aria-autocomplete="list"
				aria-controls={id ? `${id}-listbox` : undefined}
				autoComplete="country-name"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					setOpen(true);
					setActiveIndex(0);
					setValue("");
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
				className="h-12 w-full rounded-md border border-[#cfdcda] bg-white px-4 text-base text-[#576363] outline-none transition focus:border-[#5F9EA0] focus:ring-4 focus:ring-[#5F9EA0]/15"
			/>
			<input type="hidden" name={name} value={value} required={required} />
			{open && filtered.length > 0 ? (
				<ul
					id={id ? `${id}-listbox` : undefined}
					role="listbox"
					ref={listRef}
					className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-md border border-[#cfdcda] bg-white shadow-[0_12px_32px_rgba(87,99,99,0.12)]"
				>
					{filtered.map((country, i) => (
						<li
							key={country}
							data-index={i}
							role="option"
							aria-selected={country === value}
							onMouseDown={(e) => {
								e.preventDefault();
								commit(country);
							}}
							onMouseEnter={() => setActiveIndex(i)}
							className={`cursor-pointer px-4 py-2 text-sm ${
								i === activeIndex
									? "bg-[#5F9EA0]/10 text-[#576363]"
									: "text-[#5d6163] hover:bg-[#f7faf9]"
							}`}
						>
							{country}
						</li>
					))}
				</ul>
			) : null}
			{open && filtered.length === 0 ? (
				<div className="absolute z-20 mt-2 w-full rounded-md border border-[#cfdcda] bg-white px-4 py-3 text-sm text-[#5d6163] shadow-[0_12px_32px_rgba(87,99,99,0.12)]">
					No matching country.
				</div>
			) : null}
		</div>
	);
}
