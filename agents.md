# Agent Resources & References

## Project Purpose

This is an **experimental prototype** that mimics the existing platform but allows for much faster iteration as a stand-alone experience. The goal is to validate user experience with potential future users.

**Key points:**
- **Not connected to backend** - Most functionality is mocked/simulated
- **Operational in stages** - Features should work in complete workflows, even if isolated
- **Prototype-first mindset** - Speed of iteration matters more than production-readiness
- **UX validation focus** - The primary goal is testing and validating user experience concepts

---

This document contains useful resources and patterns for building with React and related technologies.

---

## You Might Not Need an Effect

**Source:** https://react.dev/learn/you-might-not-need-an-effect

### Main Problem Categories & Solutions

#### 1. Transforming Data for Rendering
**Problem:** Using Effects to update state when props/state change causes unnecessary render cycles.

**Solution:** Calculate data at the component's top level during rendering:
```js
// Avoid
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// Good
const fullName = firstName + ' ' + lastName;
```

#### 2. Caching Expensive Calculations
**Problem:** Recalculating expensive computations on every render.

**Solution:** Use `useMemo` to cache results:
```js
const visibleTodos = useMemo(
  () => getFilteredTodos(todos, filter),
  [todos, filter]
);
```

#### 3. Resetting State on Prop Changes
**Problem:** Clearing state variables when props change causes extra re-renders.

**Solution:** Use the `key` prop to reset entire component trees:
```js
<Profile userId={userId} key={userId} />
```

#### 4. Handling User Events
**Problem:** Using Effects for event-triggered logic (like form submissions).

**Solution:** Handle logic in event handlers where you know exactly what happened:
```js
// Avoid: Effect with conditional logic
useEffect(() => {
  if (product.isInCart) {
    showNotification(...);
  }
}, [product]);

// Good: Event handler
function handleBuyClick() {
  addToCart(product);
  showNotification(...);
}
```

#### 5. Chained State Updates
**Problem:** Multiple Effects updating state sequentially cause cascading re-renders.

**Solution:** Calculate all state changes in one event handler:
```js
function handlePlaceCard(nextCard) {
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

#### 6. Notifying Parent Components
**Problem:** Using Effects to notify parents causes delayed updates.

**Solution:** Update both component states in the same event handler:
```js
function updateToggle(nextIsOn) {
  setIsOn(nextIsOn);
  onChange(nextIsOn);  // Notify parent synchronously
}
```

### When Effects ARE Needed

Effects are appropriate for:
- Synchronizing with external systems (widgets, browser APIs, non-React code)
- Data fetching with proper cleanup for race conditions
- Subscribing to external stores (use `useSyncExternalStore` preferentially)
- Logic that runs because the component was *displayed* to the user

### Core Decision Framework

Ask yourself:
- Can this be calculated during rendering?
- Is this triggered by a specific user interaction?
- Should this code run *because* the component was displayed?

If the answer to the first two is "yes," use those approaches instead of Effects. If the answer to the third is "yes," then use an Effect.

### Key Takeaway

> If there is no external system involved, you shouldn't need an Effect. Removing unnecessary Effects makes code easier to follow, faster to run, and less error-prone.
