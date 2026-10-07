# Graph Report - employe-management  (2026-10-07)

## Corpus Check
- 68 files · ~53,242 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 38 file(s) not represented in the graph (top: .scss 34, (none) 2, .example 1)

## Summary
- 427 nodes · 1091 edges · 18 communities (13 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6ef6207`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- App.jsx
- firebaseService.js
- Package scripts
- ProjectBoard/index.jsx
- useTask
- UserManagement/index.jsx
- Runtime dependencies
- ProjectCalculator/index.jsx
- Dev tooling
- Landing/index.jsx
- main.jsx
- Sound effects
- Vercel env sync
- Theme bootstrap
- Date formatting
- Deploy script
- Vercel rewrites

## God Nodes (most connected - your core abstractions)
1. `react` - 44 edges
2. `useAuth()` - 44 edges
3. `react-icons` - 28 edges
4. `useTask()` - 25 edges
5. `framer-motion` - 22 edges
6. `exportProjectCalculator()` - 18 edges
7. `react-router-dom` - 17 edges
8. `getRoleDisplayName()` - 16 edges
9. `Button` - 13 edges
10. `permissionUtils` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Conventions` --references--> `useTask()`  [INFERRED]
  AGENTS.md → src/contexts/TaskContext.jsx
- `favicon.svg` --conceptually_related_to--> `Team Logo Mark`  [AMBIGUOUS]
  index.html → src/assets/logo.svg
- `Auth and routes` --references--> `ProtectedRoute()`  [INFERRED]
  AGENTS.md → src/App.jsx
- `Auth and routes` --references--> `RouteGuard()`  [INFERRED]
  AGENTS.md → src/App.jsx
- `Conventions` --references--> `useAuth()`  [INFERRED]
  AGENTS.md → src/contexts/AuthContext.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pre-paint Theme Resolution** — index_theme_bootstrap, index_gettheme, index_applytheme, index_theme_storage_key, index_prefers_color_scheme, index_data_theme [EXTRACTED 1.00]
- **Three-Person Team Mark** — src_assets_logo_logomark, src_assets_logo_indigo_tile, src_assets_logo_central_figure, src_assets_logo_flanking_figures [EXTRACTED 1.00]

## Communities (18 total, 5 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.10
Nodes (29): Auth and routes, Commands, Conventions, Employee Management System, graphify, Layout, react-dom, LandingGate() (+21 more)

### Community 1 - "App.jsx"
Cohesion: 0.08
Nodes (50): date-fns, framer-motion, react, react-icons, react-router-dom, react-select, Analytics, Commissions (+42 more)

### Community 2 - "firebaseService.js"
Cohesion: 0.10
Nodes (26): @emailjs/browser, firebase, TaskContext, TaskProvider(), app, auth, db, firebaseConfig (+18 more)

### Community 3 - "Package scripts"
Cohesion: 0.06
Nodes (37): name, private, scripts, build, build:local, deploy:firebase, deploy:vercel, dev (+29 more)

### Community 4 - "ProjectBoard/index.jsx"
Cohesion: 0.11
Nodes (29): ProjectBoard, src_components_estimatedtimeselector_estimatedtimeselector, ESTIMATE_TEMPLATES, EstimatedTimeSelector(), LinkifiedText(), RichTextViewer, src_components_richtextviewer_richtextviewer, TaskDetails (+21 more)

### Community 5 - "useTask"
Cohesion: 0.15
Nodes (23): src_components_aichatbot_aichatbot, AIChatbot, Header, useNotification(), useTask(), buildSystemPrompt(), callOpenAI(), getApiKey() (+15 more)

### Community 6 - "UserManagement/index.jsx"
Cohesion: 0.10
Nodes (24): UserManagement, Analytics(), getPermissionsForRole(), MANAGER_TYPE_OPTIONS, normalizeManagerType(), ROLE_OPTIONS, STATUS_DISPLAY, UserCard() (+16 more)

### Community 7 - "Runtime dependencies"
Cohesion: 0.09
Nodes (22): dependencies, bootstrap, date-fns, @emailjs/browser, emailjs-com, firebase, framer-motion, gsap (+14 more)

### Community 8 - "ProjectCalculator/index.jsx"
Cohesion: 0.14
Nodes (21): ProjectCalculator, fixedSelectStyles, PROJECT_TYPE_OPTIONS, ProjectCalculator(), src_pages_projectcalculator_projectcalculator, applyCellStyle(), createExpenseAmountStyle(), createExpenseHeaderStyle() (+13 more)

### Community 9 - "Dev tooling"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, baseline-browser-mapping, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss (+7 more)

### Community 10 - "Landing/index.jsx"
Cohesion: 0.11
Nodes (17): gsap, lenis, Landing, src_components_appfooter_appfooter, AppFooter, src_components_creatorcredit_creatorcredit, CreatorCredit, APP_NAME (+9 more)

### Community 11 - "main.jsx"
Cohesion: 0.08
Nodes (26): applyTheme, Crimson Pro, data-theme, index.html document shell, favicon.svg, Fraunces, getTheme, Google Fonts (+18 more)

### Community 13 - "Vercel env sync"
Cohesion: 0.25
Nodes (6): ref_node_child_process, ref_node_fs, envPath, obsolete, text, vars

## Ambiguous Edges - Review These
- `favicon.svg` → `Team Logo Mark`  [AMBIGUOUS]
  index.html · relation: conceptually_related_to

## Knowledge Gaps
- **112 isolated node(s):** `deploy.sh script`, `name`, `private`, `version`, `type` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 174 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `favicon.svg` and `Team Logo Mark`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `react` connect `App.jsx` to `useAuth`, `firebaseService.js`, `Package scripts`, `ProjectBoard/index.jsx`, `useTask`, `UserManagement/index.jsx`, `ProjectCalculator/index.jsx`, `Landing/index.jsx`, `main.jsx`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime dependencies` to `Package scripts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `deploy.sh script`, `name`, `private` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0824561403508772 - nodes in this community are weakly interconnected._
- **Should `firebaseService.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._