---
## Task ID: 1 - fullstack-developer
### Work Task
Reapply all changes to transform competition-tracker from Prisma ORM to file-based JSON storage, with multiple UI and data model changes.

### Work Summary

#### Files Created:
1. **`/home/z/my-project/data/competitions.json`** — Empty JSON array `[]` for competition storage
2. **`/home/z/my-project/data/teams.json`** — Empty JSON array `[]` for team storage
3. **`/home/z/my-project/src/lib/storage.ts`** — File-based CRUD module with full TypeScript interfaces and all read/write operations for both Competitions and Teams

#### Files Modified:
4. **`/home/z/my-project/src/app/api/competitions/route.ts`** — Replaced Prisma with storage.ts (GET with archived filter, POST with mealCost)
5. **`/home/z/my-project/src/app/api/competitions/[id]/route.ts`** — Replaced Prisma with storage.ts (GET, PUT with mealCost, DELETE with cascade team deletion)
6. **`/home/z/my-project/src/app/api/teams/route.ts`** — Replaced Prisma with storage.ts (GET, POST with mealDays/hasPhoneContact)
7. **`/home/z/my-project/src/app/api/teams/[id]/route.ts`** — Replaced Prisma with storage.ts (GET, PUT, DELETE)
8. **`/home/z/my-project/src/app/page.tsx`** — Complete rewrite with:
   - Removed `location` field and `MapPin`/`Send` imports
   - Added `mealCost` to Competition interface
   - Added `mealDays` and `hasPhoneContact` to Team interface
   - Competition forms: removed location, added "Стоимость 1 питания" input
   - Team forms: added "Дней питания" input, three toggle switches row (Telegram | MAX | По телефону) in bordered boxes
   - Statistics: money amounts (paid/unpaid/total in rubles with formatted thousands), meal portions, cost per meal
   - Competition cards: show mealCost per meal, paid/unpaid amounts in green/orange
   - Team cards: show "X чел. · Y дн. пит.", green "По телефону" badge
   - Extracted reusable form rendering functions (`renderTeamFormFields`, `renderCompFormFields`)
9. **`/home/z/my-project/package.json`** — Removed `prisma generate` from build script
10. **`/home/z/my-project/postcss.config.mjs`** — Updated to use `@tailwindcss/postcss` plugin

#### Build Result:
`npx next build` passed successfully with all routes compiling correctly.

#### Commit:
`550e178` — "Добавлено: JSON-хранилище, стоимость питания, дни питания, «По телефону»" pushed to origin/main.
