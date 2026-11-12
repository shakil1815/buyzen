"use client";

import { useMemo, useState } from "react";
import { findDistrict, projectToSvg } from "@/lib/bangladesh";
import type { MapPoint } from "@/lib/admin/locations";

export type ConsentedCustomer = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  district: string | null;
  division: string | null;
};

export function BangladeshMap({
  points,
  customers,
}: {
  points: MapPoint[];
  customers: ConsentedCustomer[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [division, setDivision] = useState<string>("all");

  const divisions = useMemo(
    () => [...new Set(points.map((point) => point.division))].sort(),
    [points],
  );

  const visible = points.filter(
    (point) => division === "all" || point.division === division,
  );

  const max = Math.max(...visible.map((point) => point.customers), 1);
  const selectedPoint = points.find((point) => point.district === selected);
  const selectedCustomers = selected
    ? customers.filter(
        (customer) => customer.district === selected || customer.city === selected,
      )
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={division}
            onChange={(event) => setDivision(event.target.value)}
            className="input w-auto"
            aria-label="Filter map by division"
          >
            <option value="all">All divisions</option>
            {divisions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-fg-subtle">
            Bubble size = number of consented customers. Positions are district
            centroids, never precise coordinates.
          </p>
        </div>

        <div className="card overflow-hidden bg-surface-2 p-2">
          <svg
            viewBox="0 0 1000 900"
            className="h-auto w-full"
            role="img"
            aria-label="Customer distribution across Bangladesh"
          >
            <defs>
              <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#eef4ff" />
                <stop offset="100%" stopColor="#e2e8f5" />
              </linearGradient>
            </defs>
            <rect width="1000" height="900" rx="18" fill="url(#mapBg)" />

            {/* Division grouping outline */}
            {divisions.map((item) => {
              const members = points.filter(
                (point) => point.division === item,
              );
              if (members.length === 0) return null;
              const coords = members
                .map((point) => {
                  const info = findDistrict(point.district);
                  return info ? projectToSvg(info.lat, info.lng) : null;
                })
                .filter((coord): coord is { x: number; y: number } => !!coord);
              if (coords.length === 0) return null;
              const minX = Math.min(...coords.map((coord) => coord.x)) - 40;
              const maxX = Math.max(...coords.map((coord) => coord.x)) + 40;
              const minY = Math.min(...coords.map((coord) => coord.y)) - 40;
              const maxY = Math.max(...coords.map((coord) => coord.y)) + 40;
              return (
                <rect
                  key={item}
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
                  rx={28}
                  fill="none"
                  stroke="#b9c4da"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                />
              );
            })}

            {visible.map((point) => {
              const info = findDistrict(point.district);
              if (!info) return null;
              const { x, y } = projectToSvg(info.lat, info.lng);
              const radius = 8 + (point.customers / max) * 26;
              const active = selected === point.district;
              return (
                <g
                  key={point.district}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelected(active ? null : point.district)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(active ? null : point.district);
                    }
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={active ? "#1f43f5" : "#3366ff"}
                    fillOpacity={active ? 0.95 : 0.35 + (point.customers / max) * 0.5}
                    stroke="#1f43f5"
                    strokeWidth={active ? 3 : 1.5}
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    className="fill-white text-[11px] font-bold"
                  >
                    {point.customers}
                  </text>
                  <title>{`${point.district} — ${point.customers} consented customers, ${point.orders} orders`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold text-fg">
          {selectedPoint ? selectedPoint.district : "District detail"}
        </h3>
        {selectedPoint ? (
          <>
            <p className="mt-1 text-xs text-fg-muted">
              {selectedPoint.division} division ·{" "}
              {selectedPoint.customers} consented customer
              {selectedPoint.customers === 1 ? "" : "s"} ·{" "}
              {selectedPoint.orders} orders delivered
            </p>
            <ul className="mt-4 space-y-2">
              {selectedCustomers.length === 0 ? (
                <li className="rounded-lg bg-surface-2 p-3 text-xs text-fg-muted">
                  No consented customer profiles in this district yet.
                </li>
              ) : null}
              {selectedCustomers.map((customer) => (
                <li
                  key={customer.id}
                  className="flex items-center gap-3 rounded-lg border border-line px-3 py-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-fg">
                    {customer.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {customer.name}
                    </p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {customer.email} · {customer.city ?? customer.district}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-xs text-fg-muted">
            Click a bubble on the map to see the consented customers and order
            activity for that district.
          </p>
        )}
      </div>
    </div>
  );
}
