# Add 100% Test Coverage & Mutation Testing

This plan outlines the strategy to achieve complete 100% test coverage across the TeamSync Next.js application, along with the integration of mutation testing to ensure the tests are robust and capable of catching actual code defects.

> [!WARNING]
> **Node.js Environment Blocker**: As we encountered earlier, your current environment cannot download/install Node.js. While I can write all the test code, configuration files, and dependencies to `package.json`, **you will not be able to execute these tests** (`npm test` or `npm run stryker`) locally until Node.js is installed on your Mac. 

## Proposed Tools
- **Test Runner:** **Vitest** (Faster than Jest, excellent ESM support, great for Next.js).
- **UI Testing:** **React Testing Library** (RTL) & `jsdom`.
- **Mutation Testing:** **Stryker Mutator** (Industry standard for JS/TS mutation testing).

## Proposed Changes

### 1. Configuration & Dependencies
#### [MODIFY] `package.json`
- Add dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@vitejs/plugin-react`, `jsdom`, `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`.
- Add npm scripts: `"test": "vitest run --coverage"`, `"mutate": "stryker run"`.

#### [NEW] `vitest.config.js`
- Configure Vitest for React, define `jsdom` environment, set alias `@/` mapping, and enforce 100% coverage thresholds for statements, branches, functions, and lines.

#### [NEW] `stryker.conf.json`
- Configure Stryker to use the Vitest runner, target `src/**/*.js`, and exclude configuration files or Next.js internals.

---

### 2. Phase 1: Utilities & Core Logic
#### [NEW] `src/utils/helpers.test.js`
- 100% branch/statement coverage for all date parsing, formatting, and string manipulation functions.

#### [NEW] `src/lib/__mocks__/firebase.js`
- Create mocks for Firebase Auth and Firestore to prevent real network calls during testing.

#### [NEW] `src/lib/firestore.test.js` & `src/lib/auth.test.js`
- Test CRUD operations, snapshot subscriptions, and error handling.

---

### 3. Phase 2: Contexts & State
#### [NEW] `src/context/ToastContext.test.js`
- Test adding, auto-removing, and manually dismissing toasts.
#### [NEW] `src/context/AuthContext.test.js`
- Test user state changes and loading states.

---

### 4. Phase 3: UI Components
#### [NEW] Component Tests
- `TaskCard.test.js`, `KanbanBoard.test.js`, `MeetingNotes.test.js`, etc.
- Test rendering, user events (clicks, typing), accessibility roles, and drag-and-drop simulated events.
- Mock `Chart.js` for the Analytics component tests to avoid canvas rendering issues in jsdom.

---

### 5. Phase 4: Pages
#### [NEW] Page Tests
- `src/app/page.test.js` and `src/app/login/page.test.js`.
- Test layout integration and protected route redirect logic.

## User Review Required

> [!IMPORTANT]
> Achieving 100% test coverage and resolving all surviving mutants for an entire Next.js/Firebase application requires generating thousands of lines of test code and mock data. 
> 
> **How would you like to proceed?**
> 1. Write the configuration files and implement tests incrementally (e.g., start with Utilities and Contexts first).
> 2. Attempt to write as much test code across the entire codebase right now in one massive push.
> 3. Hold off on testing until you are able to install Node.js locally to run them.

Please let me know how you would like me to proceed!
