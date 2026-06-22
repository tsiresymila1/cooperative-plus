# Cooperative Plus — Dashboard Wireframes (ASCII)

Low-fidelity layouts. shadcn/ui + Tailwind. Mobile-first; desktop adds side nav.

## A. Platform Admin Dashboard
```
┌───────────────────────────────────────────────────────────────┐
│ Cooperative Plus · Admin            [search]      🔔  ⚙  (PA) ▾ │
├──────────┬────────────────────────────────────────────────────┤
│ Overview │  Platform Overview                    [This month ▾]│
│ Coops    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ │
│ Plans    │  │ MRR     │ │ Active  │ │ Active  │ │ Active     │ │
│ Dest.    │  │ 12.4M ₳ │ │ Coops 47│ │ Bkgs 312│ │ Users 5.1k │ │
│ Stats    │  │ +8% ▲   │ │ +3 ▲    │ │ today   │ │            │ │
│ Audit    │  └─────────┘ └─────────┘ └─────────┘ └────────────┘ │
│          │  ┌──────────────── Revenue (12 mo) ───────────────┐ │
│          │  │  ▁▂▃▃▄▅▅▆▇▇██  (subscriptions + tx fees)        │ │
│          │  └────────────────────────────────────────────────┘ │
│          │  Cooperatives                       [+ New] [filter] │
│          │  ┌──────────────────────────────────────────────┐  │
│          │  │ Name        Plan    Status    MRR    Bookings │  │
│          │  │ Kofmad      Pro     ● active  220k   1,204    │  │
│          │  │ Soatrans    Growth  ● active  120k     876    │  │
│          │  │ TransVato   Starter ⏸ suspend  0       12    │  │
│          │  └──────────────────────────────────────────────┘  │
└──────────┴────────────────────────────────────────────────────┘
```

## B. Cooperative Dashboard (owner)
```
┌───────────────────────────────────────────────────────────────┐
│ ☰  Kofmad Coop ▾        Today 19 Jun        🔔  + Booking  (O)▾ │
├──────────┬────────────────────────────────────────────────────┤
│ Dashboard│  ┌────────────┐┌────────────┐┌──────────┐┌────────┐ │
│ Trips    │  │Departures  ││Occupancy   ││Revenue   ││Upcoming│ │
│ Bookings │  │ today  8   ││  rate 78%  ││today 340k││ 24 trip│ │
│ Vehicles │  └────────────┘└────────────┘└──────────┘└────────┘ │
│ Routes   │  Today's Departures                                 │
│ Dest.    │  ┌──────────────────────────────────────────────┐  │
│ Payments │  │ 06:00 Tana→Majunga  18-seat  15/18  ● boarding│  │
│ Reports  │  │ 07:30 Tana→Tamatave 30-bus   22/30  ● schedld │  │
│ Team     │  │ 09:00 Tana→Fianar   15-seat  09/15  ● schedld │  │
│ Settings │  └──────────────────────────────────────────────┘  │
│          │  ┌─ Bookings funnel (7d) ─┐ ┌─ Revenue (30d) ────┐ │
│          │  │ search→hold→pay→confirm │ │  ▁▃▅▄▆▇█ trend     │ │
│          │  └─────────────────────────┘ └────────────────────┘ │
└──────────┴────────────────────────────────────────────────────┘
```

## C. Seat-map editor (owner / vehicles)
```
┌──────────── Vehicle: Mercedes 207 · 18 seats ────────────┐
│ Type [minibus_18 ▾]  Rows [6] Cols [4]   Palette:        │
│                                          [seat][aisle]   │
│        col1   col2   col3   col4         [door][driver]  │
│  row1 [ 🚍 ]  [   ]  [   ]  [door]       [empty]         │
│  row2 [ 1A ]  [ 1B ] [aisl] [ 1C ]                       │
│  row3 [ 2A ]  [ 2B ] [aisl] [ 2C ]      Seats counted:18 │
│  row4 [ 3A ]  [ 3B ] [aisl] [ 3C ]      Version: 2       │
│  row5 [ 4A ]  [ 4B ] [aisl] [ 4C ]                       │
│  row6 [ 5A ]  [ 5B ] [ 5C ] [ 5D ]      [Save map]       │
│  (click cell to cycle type · drag to paint)              │
└──────────────────────────────────────────────────────────┘
```

## D. Customer trip search + results
```
┌───────────────────────────────────────────────────────────┐
│  From [Antananarivo ▾]  To [Mahajanga ▾]  Date [19/06] Pax[2]│
│  [Search]                                                   │
├─────────────┬───────────────────────────────────────────────┤
│ Filters     │  6 trips · Mahajanga · 19 Jun                  │
│ Price ▭▭▭   │  ┌──────────────────────────────────────────┐ │
│ Depart      │  │ 06:00  Kofmad   18-seat   12 left  35k ₳  │ │
│ ☐ morning   │  │        ~8h  →14:00            [Select]    │ │
│ ☐ afternoon │  ├──────────────────────────────────────────┤ │
│ Coop ▾      │  │ 07:30  Soatrans 30-bus     3 left  30k ₳  │ │
│ Vehicle ▾   │  │        ~7h30 →15:00          [Select]    │ │
│ ☑ seats>0   │  └──────────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────────┘
```

## E. Customer seat selection
```
┌──────── Tana → Mahajanga · 06:00 · Kofmad · 35k ₳ ────────┐
│   Front                          Legend:                   │
│   [🚍]        [door]             ⬜ available ⬛ booked      │
│   [1A]⬜ [1B]⬜   [1C]⬜          🟩 selected  🟨 held       │
│   [2A]⬛ [2B]⬜   [2C]⬜                                     │
│   [3A]🟩 [3B]🟩   [3C]⬜          Selected: 3A, 3B          │
│   [4A]⬜ [4B]⬜   [4C]⬜          Total: 70k ₳               │
│   ...                            ⏱ Hold 04:58              │
│                                  [Continue → passengers]   │
└────────────────────────────────────────────────────────────┘
```

## F. Booking management / trip manifest (assistant check-in)
```
┌──── Trip 06:00 Tana→Majunga · boarding · 15/18 ────┐
│ [Scan QR]  [Search ref/phone]      Checked: 9/15    │
│ ┌─────────────────────────────────────────────────┐│
│ │ Seat Passenger      Phone     Pay     Check-in   ││
│ │ 1A   Rakoto H.      034..     ✅cash   ☑ 06:12    ││
│ │ 1B   Rasoa M.       033..     ✅momo   ☑ 06:13    ││
│ │ 3A   Jean P.        032..     ⏳pending ☐ [✓]     ││
│ └─────────────────────────────────────────────────┘│
│ [Mark departed]                                      │
└──────────────────────────────────────────────────────┘
```

## Component inventory (shadcn/ui)
`Card, Table, Tabs, Dialog, Sheet, Badge, Button, Select, Calendar/DatePicker, Form+Input, Toast/Sonner, Chart (recharts), Command (autocomplete), Avatar, DropdownMenu, Skeleton`. Custom: `SeatMap` (editor/selector modes), `HoldTimer`, `StatCard`, `RevenueChart`, `OccupancyGauge`.
