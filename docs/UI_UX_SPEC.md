# Fishing Intelligence — Pilot UI/UX

The UI is designed for a person holding a fishing rod in one hand and a phone in the other.

## Global rules

- Mobile-first portrait layout.
- Large, high-contrast touch targets.
- No required typing during routine fishing actions.
- Active Fishing is an instrument panel, not a traditional form.
- A routine action should usually take one or two taps.
- Never block logging because GPS or network service is unavailable.

## Core screens

### Home
- Start Fishing / Continue Fishing is the dominant action.
- Show quick statistics, recent trips, and "What Should I Use?"

### Start Fishing
- Choose recent body of water.
- Optional target species.
- Optional starting lure.
- Familiar trip should start in roughly 2–4 taps.

### Active Fishing
Priority order:
1. Live trip stats.
2. Current lure card.
3. Large `+ CAST` control.
4. `BITE` and `CAUGHT`.
5. `LOST` and `MARK SPOT`.
6. Batch cast controls.

Current lure card is always visible and tappable.

### Quick Catch
- Target/recent species first.
- Optional size.
- Released/Kept.
- Optional photo.
- Optional details collapsed by default.
- Save returns directly to Active Fishing.

### Change Lure
- Search.
- Favourites first.
- One tap selects the lure and returns to fishing.

### Tackle
- Search/filter inventory.
- Quick add form.
- Deactivate rather than destroy referenced history.

### Trips / Trip Detail
- Trip summary.
- Exposure and lure performance.
- Catch list.
- Event timeline.

### Insights
- Fish/hour.
- Bites.
- Casts.
- Lure ranking.
- Colour ranking.
- Always show exposure/sample size.

### What Should I Use?
- Rank tackle using personal results.
- Show fish/hour, fish/100 casts, trips, and casts.
- Show LOW/MEDIUM/HIGH confidence.
- Never invent historical evidence.

### Map
- Private catch and spot markers.
- Exact coordinates only from the logged-in user's RLS-protected records.
