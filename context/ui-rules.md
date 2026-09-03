<!-- Normative product UI behavior and composition. Review before each UI phase. -->

# UI Rules

## Adopted Reference Direction

The reviewed AI Flow frontend is a visual and structural reference, not an implementation source. CMO Studio adopts:

- Inter typography and a dark-first neutral theme with Light and System options;
- compact controls, a restrained top bar, border-first cards, and shallow 8px radii;
- semantic shadcn-style component variants backed by CSS variables;
- route-local components for one-route UI and shared primitives for repeated UI;
- small independent loading boundaries and explicit loading/error/empty/retry states; and
- Lucide icons with consistent sizing.

CMO Studio explicitly does not copy the reference's floating magnifying dock, mobile “rotate device” blockade, rainbow/glow decoration, animated backgrounds, dashboard charts without a product decision, hardcoded palette/status colors, multiple icon libraries, or duplicated component logic. The fixed six-agent information architecture requires labelled persistent navigation, not an icon-only dock.

## Product Feel

CMO Studio is a focused AI marketing operations room: neutral, compact, traceable, and human-controlled. Conversation, ownership, current stage, artifacts, and approvals are more prominent than decoration. It must not resemble a generic project board or inherit the animated Event Classics landing page.

Use sentence case, concise labels, and plain-language outcomes. A reviewer should always be able to answer: which brand, which agent or campaign, what is happening, what needs attention, and what action is safe next.

## Theme and Typography

- Product UI uses Inter and the scale in `ui-tokens.md`.
- New users start in Dark; Dark, Light, and System are available from the header theme control.
- Theme changes apply only to the product shell and must not flash the wrong theme during navigation.
- Technical identifiers may use the registered system monospace stack only in optional technical details.
- Marketing fonts remain confined to marketing routes.
- All product colors come from semantic variables; components never choose theme-specific raw colors.

## Route and Style Isolation

- The root layout owns only global CSS, font registration, and neutral document structure.
- Marketing SmoothScroll/effects move into `(marketing)/layout.tsx` while preserving `/`.
- `/app/layout.tsx` owns product metadata, theme resolution, normal blending, native scroll, and `AppShell`.
- No Lenis, GSAP, shader, Three.js, marketing video, `MagneticButton`, or marketing blend code loads in the `/app` route tree.
- Product styles restore normal overflow, scroll anchoring, and selection behavior where marketing globals altered them.
- The `.cmo-app` boundary owns product theme variables so marketing and application styles cannot leak into each other.

## Application Shell

- Desktop sidebar: fixed 280px column.
- Product top bar: 56px high within the application column.
- Wide content container: up to 1440px; readable detail regions: up to 1120px.
- Main column always has `min-width: 0`; page gutters follow `ui-tokens.md`.
- The shell uses `100dvh` and safe-area padding where needed.
- Borders and spacing define regions; avoid nested floating cards.
- Chat owns one stable message scroll region with the composer outside and immediately below it.

### Top Bar

- Desktop: current page/context on the left; Simulation/runtime status, theme selector, and Owner menu on the right.
- Mobile: navigation trigger and compact workspace switcher on the left; only essential status/account actions on the right.
- Do not duplicate the desktop workspace switcher in both sidebar and top bar.
- Simulation mode must remain visible without overpowering the current task.

## Navigation

```text
Workspace switcher

YOUR AI TEAM
  AI CMO
  Audience Researcher
  Brand Strategist
  UGC Writer
  Media Producer
  Creative QA

WORKSPACE
  Campaigns
  Memory
  Brand settings
```

- Desktop uses the labelled left sidebar above; do not substitute the reference's floating icon dock.
- There is no **New conversation** action: the prototype has one canonical direct thread per workspace-agent.
- Selected rows use `app-surface-subtle`, primary text, `aria-current`, and a non-color-only indicator.
- Agent rows show identity, role, and optional queued/running/waiting text; state labels must not cause layout jitter.
- Pending approvals appear as a Campaigns count, not a separate top-level page.
- When switching brands from an agent chat, retain the stable agent key in the target brand.
- When switching from campaign detail, open the target brand's campaign list; never reuse a foreign campaign ID.
- Invalid or cross-workspace routes render the same scoped not-found state without revealing existence.

## Workspace Creation and Settings

- Workspace creation is a dedicated labelled form linked from the switcher; it is not embedded as a fragile menu form.
- Brand name and product summary are required. Audience, voice, approved claims, and restrictions are optional.
- Show field limits, validation errors, and the effect of the Manual/Auto default before Save.
- Keep the user's values when Save fails; close/reset only after confirmed success.
- An incomplete profile is a visible notice, not a blocker; agents ask for required campaign context later.
- Brand settings allow profile and default-approval edits with explicit Save and Cancel.
- Agent configuration is a read-only summary. Do not show editable prompt, tool, model, or capability controls.
- No delete/archive workspace control appears in the prototype.

## Direct Chat

- User messages align right on `app-surface-strong`; agent messages align left on the primary surface.
- Repeat agent identity only when speaker or context changes.
- Maximum readable message width is 720px.
- Messages, activities, handoffs, approvals, and artifacts remain distinct semantic objects; never render raw JSON as chat.
- The composer supports multiline text, Send, queued state, and Cancel run. There is no attachment placeholder.
- Enter sends; Shift+Enter inserts a newline. An accessible hint explains this behavior.
- Enter must not send while an input method editor is composing text.
- After Send, focus remains in the composer unless an error requires focus. Cancel and Retry restore sensible focus.
- When the selected agent is busy, a submitted message appears as `Queued`; only one run is active for that workspace-agent instance.
- Progress text describes meaningful stages; never fabricate typing or reveal chain-of-thought.
- Cancel affects the current attempt and preserves the message/thread. Retry creates a new visible attempt.
- Agent details explain that older visible messages may fall outside current model context and accepted memory is the durable cross-run mechanism.

### Chat Scrolling and Announcements

- Auto-scroll only while the user is already near the latest message.
- When the user reads history, preserve position and show a **New messages** control.
- Announce completed messages and meaningful run-state changes through one polite live region.
- Do not announce streaming tokens, timers, or every progress event.
- Reconnecting or resynchronizing state is visible and does not duplicate already rendered events.

## Capability and Handoff

- Every agent header has a concise capability/limitation summary and a plain-language details panel.
- Do not expose system prompts, raw policy expressions, secrets, or model reasoning.
- A denied action uses danger styling on the action/notice, not the whole agent session.
- For an out-of-scope multi-agent request, show the denial and exactly one linked CMO handoff.
- Handoff cards show source agent, reason, requested outcome, CMO state, and resulting campaign link if accepted.
- States are `pending`, `accepted`, `declined`, `needs clarification`, and `cancelled`.
- One handoff is projected in the source and CMO threads; it never appears as two independent records.
- Acceptance may create a campaign draft only. Explicit **Start campaign** is still required.

## Campaign Plan and Start

Before execution the CMO shows one structured `CampaignPlanCard` containing:

- required brief fields and any missing-information callout;
- the fixed UGC task sequence and named agent owners;
- deliverables and a Simulation notice;
- preselected Manual/Auto mode with concise consequences; and
- one primary **Start campaign** action.

Before Start, the campaign is `Draft` and no task appears to run. After Start, the snapshotted approval mode is read-only. **Cancel draft** and **Cancel campaign** are separate secondary actions.

## Campaigns

### List

- Use a compact list/table hybrid, not kanban.
- Columns: campaign, status, approval mode, current owner/stage, required action, and updated time.
- Mobile rows stack the same information without hiding required actions.
- Filters are limited to status and approval mode.
- `Waiting approval`, `Waiting for you`, `Failed`, and `Simulation` are always written as text.
- Loading skeletons match row geometry; error and empty states occupy the same list region.

### Detail

Campaign detail uses three zones:

1. Snapshotted brief, mode, and current action
2. Fixed task flow and current pre-production approval
3. Artifacts, QA, final report, and optional activity details

- Dependencies use indentation/connectors plus explicit DOM text such as “Blocked by Audience Research and Brand Strategy.”
- Each task shows owner, state, revision/attempt, inputs, output summary, wait/failure reason, next action, and artifacts.
- Parallel tasks may sit side by side on wide screens but remain in logical DOM order.
- Never show a freeform/canvas DAG editor.
- A failed mandatory task states which dependents were blocked and whether Retry or user action is available.
- Activity shows structured redacted milestones, never hidden agent transcripts.

## Approvals

- The prototype checkpoint is **Pre-production approval**, after script/storyboard preflight and before Media Producer work begins.
- The current Manual card prominently lists the exact script and storyboard titles, versions, and human-readable change summary being reviewed; immutable IDs and hashes remain in technical details.
- Actions are **Approve** and **Request changes**. Request changes requires feedback.
- **Cancel campaign** is a separate confirmed destructive action; it is not an approval outcome.
- Full subject artifacts remain inspectable while deciding; approval is an inline campaign state, not a blocking modal.
- Auto history reads “Automatically approved after preflight validation” and includes the safe policy reason.
- Superseded/stale approvals are read-only and link to their subject versions.
- If a decision loses a concurrency race, refetch and explain that the approval changed instead of showing success.

## Artifacts

- Cards show type, title, producing agent, logical version, created time, lifecycle/review status, and Simulation when applicable.
- Text artifacts open in a readable panel rendered without raw HTML.
- Storyboards use ordered shot cards.
- Simulated media is a labelled placeholder, never a playable/generated video.
- Download, upload, share, and publish controls do not appear.
- Version history appears only when more than one version exists and explains stale/superseded relationships.
- Provenance lists input artifact versions and producing run/agent; raw IDs stay in optional technical details.
- Generated links use an allowed URL scheme and external-link safety attributes.
- Research artifacts show evidence basis and mark assumptions or claims needing external verification.

## Final CMO Report

- Persist and display the report as the final campaign artifact.
- Sections: objective/brief, final artifact versions, decisions/rationale, approval history, QA result, unresolved risks, task provenance, Simulation status, and usage summary.
- Post one CMO message with a campaign/report link into the originating CMO thread.
- Do not show campaign success until the report artifact exists and QA has passed.

## Memory

- Separate Shared brand memory from Agent-private memory.
- Private memory requires selecting an agent and explains that other agents, including the CMO, cannot retrieve it; the Owner can inspect/manage it.
- Show provenance, version, updated time, and `proposed`, `active`, `rejected`, or `archived` status.
- Agent-proposed shared facts require explicit Owner Accept or Reject.
- Editing an active record creates a reviewed successor version; long text never auto-saves.
- Memory is untrusted learned context, not immutable truth.
- Secret-like or oversized content produces a safe rejection without echoing the sensitive value.
- No cross-brand copy/link control appears.

## Async, Empty, and Failure States

- Every independent async region has explicit loading, success, empty, error, and retry behavior.
- Use skeletons only when final geometry is known; otherwise show a compact progress message.
- Empty states explain the next useful action.
- Errors preserve typed drafts and provide Retry or safe navigation recovery.
- A disconnected event stream shows `Reconnecting…`, reconnects, and refetches authoritative state.
- A cursor gap shows a brief resync state; it does not replay fabricated activity.
- Never fabricate successful agent output while runtime work is unavailable.
- Simulation/mock mode is visible globally enough that no reviewer can mistake it for production.
- Independent regions use independent Suspense/error boundaries so one slow panel does not blank an entire page.

## Reuse and Component Composition

The code-level second-use rule in `code-standards.md` is mandatory for UI work.

- Search `ui-registry.md`, `src/components/ui`, and the nearest feature before creating a component or class recipe.
- A one-route composition begins in that route's `_components` folder.
- On its second semantic use, move it to the nearest shared feature/UI owner, migrate both call sites in the same change, and delete the local copy.
- Repeated markup, interaction behavior, Tailwind bundles, status mappings, empty states, form-field shells, and dialog headers count as duplicated UI.
- Component variants live in one typed variant definition; do not fork near-identical button/card/badge files.
- Status text, icon, tone, and priority come from one exhaustive typed status registry.
- Do not build a universal component with arbitrary flags for unrelated semantics. Share only a real repeated pattern and keep domain components explicit.
- Shared primitives own styling/accessibility; feature components own product meaning; pages own composition and data boundaries.
- Update `ui-registry.md` after a shared component is implemented and visually reviewed.

## Forms, Controls, and Status

- Use only registered primitives and variants from `ui-registry.md` and tokens from `ui-tokens.md`.
- Prefer one primary action per region.
- Inputs have persistent visible labels; placeholders are examples only.
- Validation appears beside the field and in an accessible summary when submission fails.
- Disabled controls explain why when the reason is not obvious.
- Destructive actions require confirmation only when difficult to reverse.
- Status always uses readable text plus an icon/shape where helpful; color is supplementary.
- Cards represent meaningful objects, not every subsection.
- Icon-only buttons require an accessible name and a tooltip when meaning is ambiguous.

## Responsive Behavior

- Under 1024px, the sidebar becomes a focus-trapped drawer; the top bar gains the navigation trigger and workspace switcher.
- Under 720px, campaign secondary detail becomes a full-screen drill-in; browser Back returns to campaign overview.
- The composer remains above the mobile keyboard where supported.
- Essential status, approval, error, Retry, and Cancel controls remain available on mobile.
- Controls reach at least 44px by 44px on coarse pointers.
- Never block phones/tablets with a rotate-device or desktop-only message.
- Support browser zoom to 200% without horizontal page scrolling; local artifact/code regions may scroll when necessary.

## Accessibility

- Target WCAG 2.2 AA for contrast, keyboard behavior, focus, reflow, labels, and status communication.
- Use semantic landmarks: navigation, header, main, and complementary activity/detail regions.
- Semantic HTML comes before ARIA.
- Drawers/dialogs trap focus and restore it to the trigger.
- Approval-required may announce assertively once; ordinary progress uses polite announcements.
- Preserve logical DOM order when wide layouts place tasks side by side.
- Respect reduced motion, safe areas, coarse-pointer targets, and visible focus.
- Do not put critical information only in hover, connectors, color, position, or animation.

## Do Nots

- Do not use marketing effects, autoplay media, smooth scrolling, parallax, spring navigation, or continuous animation in `/app`.
- Do not use the reference frontend's floating dock, hard mobile blockade, glow/rainbow decoration, or chart-heavy dashboard styling.
- Do not reveal chain-of-thought, hidden prompts, secrets, or raw runtime transcripts.
- Do not use generic chat bubbles for tools, approvals, tasks, handoffs, or artifacts.
- Do not expose raw database IDs except in optional technical details.
- Do not show nonfunctional attachments, downloads, publishing, agent editing, or deletion controls.
- Do not add dashboards/charts without a concrete user decision they improve.
- Do not use color alone for agent identity, status, dependency, or approval state.
- Do not copy component markup, class strings, formatter functions, or status switches into a second location.
