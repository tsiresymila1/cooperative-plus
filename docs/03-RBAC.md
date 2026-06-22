# Cooperative Plus — RBAC Matrix

## Roles

| Role | Scope | How assigned |
|---|---|---|
| `platform_admin` | Global (all tenants) | `user.isPlatformAdmin = true` |
| `owner` | Single cooperative | `cooperative_user.role = 'owner'` |
| `assistant` | Single cooperative, fine-grained | `cooperative_user.role = 'assistant'` + `permissions[]` |
| `customer` | Self | authenticated `user`, no cooperative membership |
| `anonymous` | Public | no session |

Assistant permissions are **capability strings** stored in `cooperative_user.permissions`. Owner implicitly holds all cooperative capabilities. Authorization is checked **server-side in every Server Action / route handler** via `requireCapability(ctx, cap)`.

## Capability catalog (assistant-assignable)

```
booking.create        booking.update        booking.cancel
booking.checkin       payment.cash.collect  payment.proof.upload
trip.view             trip.manage           vehicle.manage
route.manage          destination.manage    customer.view
report.view
```

## Matrix

| Capability / Action | Platform Admin | Owner | Assistant (if granted) | Customer | Anonymous |
|---|:--:|:--:|:--:|:--:|:--:|
| **Platform** |
| Create cooperative | ✅ | ❌ | ❌ | ❌ | ❌ |
| Suspend/reactivate cooperative | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reset cooperative password | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage subscription plans | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage global destinations | ✅ | ❌ | ❌ | ❌ | ❌ |
| View platform statistics | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access any tenant data | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cooperative profile** |
| Edit cooperative profile | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing / subscription | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete cooperative | ✅ | ❌* | ❌ | ❌ | ❌ |
| **Team** |
| Create/disable assistants | ✅ | ✅ | ❌ | ❌ | ❌ |
| Set assistant permissions | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Fleet** |
| Manage vehicles & seat maps | ✅ | ✅ | `vehicle.manage` | ❌ | ❌ |
| **Network** |
| Manage routes | ✅ | ✅ | `route.manage` | ❌ | ❌ |
| Manage private destinations | ✅ | ✅ | `destination.manage` | ❌ | ❌ |
| **Scheduling** |
| Manage trip templates | ✅ | ✅ | `trip.manage` | ❌ | ❌ |
| View trips/instances | ✅ | ✅ | `trip.view` | ✅(public) | ✅(public) |
| **Bookings** |
| Create booking (staff) | ✅ | ✅ | `booking.create` | ❌ | ❌ |
| Create booking (self) | — | — | — | ✅ | ✅ |
| Update booking | ✅ | ✅ | `booking.update` | own(limited) | ❌ |
| Cancel booking | ✅ | ✅ | `booking.cancel` | own(within policy) | ❌ |
| Check-in passengers | ✅ | ✅ | `booking.checkin` | ❌ | ❌ |
| **Payments** |
| Collect cash | ✅ | ✅ | `payment.cash.collect` | ❌ | ❌ |
| Upload payment proof | ✅ | ✅ | `payment.proof.upload` | own | own |
| Pay online | — | — | — | ✅ | ✅ |
| Issue refund | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| View cooperative reports | ✅ | ✅ | `report.view` | ❌ | ❌ |

\* Cooperative deletion is platform-admin only (owner can *request* it → support flow).

## Enforcement layers (defense in depth)

1. **Session / auth** — Better Auth verifies session; `requireSession()`.
2. **Tenant resolution** — `resolveTenant()` sets `ctx.cooperativeId` from `session.activeCooperativeId` or route slug; verifies membership.
3. **Capability check** — `requireCapability(ctx, 'booking.cancel')` in the action.
4. **Query scoping** — repository functions take `cooperativeId` and inject `WHERE cooperative_id = ...`.
5. **Postgres RLS (optional)** — `SET app.cooperative_id`; policies `USING (cooperative_id = current_setting('app.cooperative_id')::uuid)`.
6. **Audit** — every mutation logged with actor + role.

```ts
// lib/auth/guard.ts (sketch)
export async function authorize(action: string, cap?: Capability) {
  const session = await requireSession();
  if (session.user.isPlatformAdmin) return { session, cooperativeId: null, role: "platform_admin" } as const;
  const coopId = session.activeCooperativeId;
  if (!coopId) throw new ForbiddenError("no active cooperative");
  const member = await getMember(coopId, session.user.id);
  if (!member || member.status !== "active") throw new ForbiddenError();
  if (member.role !== "owner" && cap && !member.permissions.includes(cap))
    throw new ForbiddenError(`missing ${cap}`);
  return { session, cooperativeId: coopId, role: member.role } as const;
}
```
