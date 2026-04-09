# Collections; Design Principles

## How assets end up in a collection

There are two ways:

- **You pick them.** Select assets, add them to a collection. You control exactly what's in it. You can add more later, or remove ones that don't belong.

- **A filter picks them.** Define criteria (all VFX finals, all assets tagged with a character, everything from a specific scene) and the collection stays current automatically. New assets that match appear; assets that stop matching disappear.

The differences in what you can do:

- You can drag new assets into a hand-picked collection. A filter-based collection decides what belongs on its own.
- You can edit the filter on a filter-based collection. There's no filter on a hand-picked one.
- Filter-based collections can break down further; a "Character" collection can show sub-views for each character automatically.

Sharing, permissions, access controls, mount to drive; all identical regardless of how assets got into the collection.

---

## Filters as release gates

Filter-based collections can serve as controlled release gates. A VFX supervisor creates a collection filtered to "final" + "approved" shots and shares it with editorial. Every time a shot gets marked as approved, it automatically appears in editorial's view. The supervisor doesn't send anything manually; they just tag the shot as approved in their own workspace, and the shared collection picks it up. The filter becomes the gate. Tagging becomes the release action.

---

## The ontology is not the collection

Characters, scenes, and locations are facts about the content; discovered from scripts, metadata, and AI tagging. These exist whether or not anyone creates a collection for them.

Smart collections are views into the ontology. The "Character" collection is a lens that groups assets by character tag. You can rename it, change its filters, delete it. The characters don't disappear; they're still tagged on the assets. The ontology persists. Collections are how you browse it.

You can choose which characters, scenes, or locations are worth browsing by; but you can't change what they're called. The names come from the content itself. You organize around the ontology; you don't edit it.

Everyone can see the Character or Scene collection. But you only see assets inside it that you already have access to. Two people looking at the same character collection may see different assets depending on what departments or shares they have access to.
