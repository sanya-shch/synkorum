# Features

## Canvas

- **Shapes:** rectangle, ellipse, diamond, line/arrow, sticky note, text, and freehand pen drawing
- **Real-time multiplayer:** cursors, selections, and live editing powered by Liveblocks (CRDT-based sync) — every shape, move, and edit streams to everyone in the room with no polling or reload
- **Alignment & distribution:** align left/center/right/top/middle/bottom and distribute spacing evenly, for 2+ (align) or 3+ (distribute) selected objects at once, as a single undo step
- **Multi-select resize:** dragging a corner on a multi-object selection scales every selected shape together, proportionally, from its own original size — not just the first one
- **Shift-to-lock aspect ratio** when resizing a single shape (keeps circles circular, squares square)
- **Zoom & pan:** scroll to pan, Ctrl/Cmd+scroll or trackpad pinch to zoom toward the cursor, on-screen zoom controls, and Ctrl/Cmd +/-/0 shortcuts
- **Connectors:** select a shape and drag one of the blue dots next to its sides onto another shape. The line snaps to the middle of that shape's side, ends in an arrowhead, and follows both shapes when they are moved, resized, nudged or aligned. A line attached to a shape ends in an arrowhead; a free line is plain. Drag a line's end handle to attach, re-attach or detach it (filled blue = attached); hold Alt to place an end without snapping and Shift to lock a free end to 45° steps. With the line tool, drag to draw; a plain click drops a default horizontal line. Deleting a shape frees the lines that were attached to it; moving a line on its own detaches it. Duplicating shapes together with their connectors keeps the copies attached to each other.
- **Keyboard shortcuts:** V/R/O/D/L/T/N/P to switch tools, Delete/Backspace to remove, Ctrl/Cmd+D to duplicate, arrow keys to nudge (Shift for 10px steps), Escape to deselect
- **Read-only share links:** share links can grant either full edit access or view-only access to an anonymous guest

## Platform

- **Custom authentication** — email/password auth built from scratch with JWT (`jose`) session tokens in httpOnly cookies and `bcryptjs` password hashing; no third-party auth provider
- **Multi-tenant organizations** — users can belong to multiple teams simultaneously, each with `ADMIN`/`MEMBER` roles and its own set of boards
- **Two invite flows:** email invites that create a full account and org membership, and anonymous share links (editable or read-only) that need no account
- **Favorites, search, and board management** — rename, delete, and organize boards per team
- **Email verification and password reset** flows with time-limited tokens
- **Marketing landing page** at `/` and a responsive dashboard and board UI (desktop, tablet and phone layouts)
