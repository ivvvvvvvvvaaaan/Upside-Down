import { renderMermaidSVG } from 'beautiful-mermaid'
import { WorkflowView } from './view'

const DIAGRAMS = {
  today: `
sequenceDiagram
    participant Ed as Editor
    participant PS as Post Supervisor
    participant PIX as PIX
    participant Exec as Creative Exec
    participant GD as Google Doc
    participant CH as Content Hub

    Ed->>PS: Export cut from AVID
    PS->>PIX: Upload cut (Cuts 1–6)
    PIX->>Exec: Share for review
    Exec->>GD: Write notes
    GD->>PS: Email notes doc
    PS->>Ed: Distill & share notes
    Note over Ed,PS: Repeat per cut
    Note over PIX,CH: Picture Lock
    PS->>PIX: Upload Locked Cut again
    PS->>CH: Upload Locked Cut again
    CH-->>PS: Downstream teams notified manually
`,
  'new-world': `
sequenceDiagram
    participant Ed as Editor
    participant PS as Post Supervisor
    participant Lib as Media Library
    participant CR as Creative Review
    participant Exec as Creative Exec
    participant DS as Downstream Teams

    Ed->>Lib: Export from AVID → dept folder
    PS->>Lib: Build session playlist
    Lib->>CR: Push session
    CR->>Exec: Invite to session
    Exec->>CR: Review, leave notes on asset
    CR->>Lib: Notes arrive on asset
    Lib->>PS: Notes surfaced in library
    PS->>Ed: Share notes
    Note over Ed,PS: Repeat per cut
    Note over Lib,DS: Picture Lock
    Exec->>CR: Approve in CR
    CR->>Lib: Approved signal
    Lib->>DS: Auto-release — one action
`,
  lifecycle: `
stateDiagram-v2
    [*] --> Working: Editor exports from AVID
    Working --> InReview: Post Supervisor pushes session to CR
    InReview --> Working: Exec leaves notes → revise
    InReview --> Approved: Exec approves in CR
    Approved --> Released: Auto-release fires
    Released --> [*]: Downstream teams access
`,
  containers: `
graph TD
    F["Folder\nHierarchical · parent-child access\nOptional dept ownership"]
    C["Collection\nFree-floating · manual curation\nRipple access to members"]
    SC["Smart Collection\nQuery-based · ontology-driven\nDiscovery only — no access grants"]
    S["Session\nAn ordered Collection pushed to CR\nGains sessionState field"]

    C -->|ordered + pushed to CR| S
    F -.->|organises| C
    SC -.->|filters within existing access| F
`,
  changes: '',
}

const OPTS = {
  transparent: true,
  bg: '#09090b',
  fg: '#e4e4e7',
  border: '#3f3f46',
  surface: '#18181b',
  line: '#52525b',
  muted: '#71717a',
  font: 'Inter',
  nodeSpacing: 24,
  layerSpacing: 36,
  padding: 32,
}

export default function WorkflowPage() {
  const svgs = {
    today: renderMermaidSVG(DIAGRAMS.today, { ...OPTS, accent: '#f87171', line: '#f87171' }),
    'new-world': renderMermaidSVG(DIAGRAMS['new-world'], { ...OPTS, accent: '#60a5fa', line: '#60a5fa' }),
    lifecycle: renderMermaidSVG(DIAGRAMS.lifecycle, { ...OPTS, accent: '#a78bfa', line: '#a78bfa' }),
    containers: renderMermaidSVG(DIAGRAMS.containers, { ...OPTS, accent: '#34d399', line: '#34d399' }),
    changes: '',
  }

  return <WorkflowView svgs={svgs} />
}
