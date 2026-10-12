# System design diagrams

These Mermaid definitions are the editable source for Section 5 of the report. They
describe the implemented architecture rather than an unrelated ideal system. They
will be rendered to high-resolution figures when the final Word report is created.

## 5.1 System architecture

```mermaid
flowchart LR
    U[Student / Faculty / Registrar / Administrator] --> B[Brave or other browser]
    B --> N[Next.js 16 application]
    N --> UI[React role dashboard]
    N --> MW[Session refresh proxy]
    N --> API[Registration route handler]
    MW --> AUTH[Supabase Auth]
    API --> Z[Zod request validation]
    Z --> RPC[PostgreSQL transaction functions]
    UI --> SSR[Supabase SSR client]
    SSR --> REST[Local Supabase REST API]
    AUTH --> PG[(PostgreSQL database)]
    REST --> RLS[Row Level Security]
    RLS --> PG
    RPC --> PG
    CSV[course_catalog.csv] --> IMP[Validated Node.js importer]
    IMP --> PG
    PG --> STUDIO[Supabase Studio]
    DOCKER[Docker Desktop] -. runs .-> AUTH
    DOCKER -. runs .-> PG
    DOCKER -. runs .-> REST
    DOCKER -. runs .-> STUDIO
```

## 5.2 Use case diagram

```mermaid
flowchart LR
    Student((Student))
    Faculty((Faculty))
    Registrar((Registrar))
    Admin((System administrator))
    Auth((Supabase Auth))

    subgraph OCRS[Orbit Online Course Registration System]
      UC1[Sign in]
      UC2[Search course catalogue]
      UC3[View seats and course details]
      UC4[Register / join waitlist]
      UC5[Drop course]
      UC6[View timetable and payments]
      UC7[View assigned sections and rosters]
      UC8[Manage offerings and registration]
      UC9[Monitor capacity and reports]
      UC10[Manage roles]
      UC11[Review health and audit trail]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Faculty --> UC1
    Faculty --> UC7
    Registrar --> UC1
    Registrar --> UC8
    Registrar --> UC9
    Admin --> UC1
    Admin --> UC10
    Admin --> UC11
    UC1 --> Auth
```

## 5.3 Application class diagram

```mermaid
classDiagram
    class RoleDashboard {
      +role: AppRole
      +name: string
      +activeView: string
      +navigate(label)
      +notify(message)
    }
    class StudentView {
      +query: string
      +registered: Set
      +changeRegistration(course)
    }
    class FacultyView {
      +courses: Course[]
      +showRoster()
    }
    class RegistrarView {
      +courses: Course[]
      +calculateUtilisation()
    }
    class AdminView {
      +showUsersAndRoles()
      +showAuditTrail()
    }
    class RegistrationAPI {
      +POST(request)
      +DELETE(request)
      -getStudent()
      -parseRequest()
    }
    class AuthService {
      +getCurrentIdentity()
      +requireRole(expectedRole)
    }
    class CourseCatalogService {
      +loadCourseCatalog(client)
    }
    class SupabaseClient {
      +auth.getUser()
      +from(table)
      +rpc(function, parameters)
    }
    class CsvImporter {
      +validateRow(row)
      +upsertTerms()
      +upsertCourses()
      +upsertSections()
    }

    RoleDashboard *-- StudentView
    RoleDashboard *-- FacultyView
    RoleDashboard *-- RegistrarView
    RoleDashboard *-- AdminView
    StudentView --> RegistrationAPI
    RegistrationAPI --> AuthService
    RegistrationAPI --> SupabaseClient
    CourseCatalogService --> SupabaseClient
    RoleDashboard --> CourseCatalogService
    CsvImporter --> SupabaseClient
```

## 5.4 Registration sequence diagram

```mermaid
sequenceDiagram
    actor S as Student
    participant UI as React Student workspace
    participant API as /api/registrations
    participant A as Supabase Auth
    participant DB as PostgreSQL + RLS

    S->>UI: Select Add to my schedule
    UI->>API: POST { sectionId }
    API->>API: Validate UUID with Zod
    API->>A: Get authenticated user
    A-->>API: User/session
    API->>DB: Read trusted user_roles row
    DB-->>API: student
    API->>DB: RPC register_for_section(sectionId)
    DB->>DB: Lock section row
    DB->>DB: Check window, hold, credits, conflict, capacity
    alt Seat is available
        DB->>DB: Upsert registered row and increment count
        DB->>DB: Append audit record
        DB-->>API: registered
    else Section is full and waitlist is enabled
        DB->>DB: Create waitlist row
        DB->>DB: Append audit record
        DB-->>API: waitlisted
    else Rule fails
        DB-->>API: transaction error
    end
    API-->>UI: JSON success or safe error
    UI-->>S: Update schedule and show status toast
```

## 5.4 Registration activity diagram

```mermaid
flowchart TD
    A([Start]) --> B[Student selects a section]
    B --> C{Authenticated?}
    C -- No --> D[Return 401 and request sign-in]
    C -- Yes --> E{Trusted role is Student?}
    E -- No --> F[Return 403]
    E -- Yes --> G[Validate section UUID]
    G --> H{Registration window open?}
    H -- No --> X[Return rule error]
    H -- Yes --> I{Unresolved hold?}
    I -- Yes --> X
    I -- No --> J{Within credit limit and conflict-free?}
    J -- No --> X
    J -- Yes --> K{Seat available?}
    K -- Yes --> L[Create registered row]
    K -- No --> M{Waitlist enabled?}
    M -- Yes --> N[Create waitlist entry]
    M -- No --> X
    L --> O[Update enrolled count]
    N --> P[Assign queue position]
    O --> Q[Append audit record]
    P --> Q
    Q --> R[Commit transaction]
    R --> S([Show success in UI])
    X --> T([Show safe error in UI])
```

## 5.5 ER diagram / database design

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : has
    AUTH_USERS ||--|| USER_ROLES : assigned
    AUTH_USERS ||--o{ REGISTRATIONS : creates
    AUTH_USERS ||--o{ WAITLIST_ENTRIES : joins
    AUTH_USERS ||--o{ STUDENT_HOLDS : receives
    AUTH_USERS ||--o{ ACADEMIC_HISTORY : completes
    AUTH_USERS ||--o{ NOTIFICATIONS : receives
    TERMS ||--o{ COURSE_SECTIONS : contains
    COURSES ||--o{ COURSE_SECTIONS : offered_as
    COURSES ||--o{ COURSE_PREREQUISITES : requires
    COURSE_SECTIONS ||--o{ SECTION_MEETINGS : scheduled_as
    COURSE_SECTIONS ||--o{ REGISTRATIONS : receives
    COURSE_SECTIONS ||--o{ WAITLIST_ENTRIES : queues
    COURSE_SECTIONS ||--o{ REGISTRATION_OVERRIDES : permits
    REGISTRATIONS ||--o{ PAYMENT_TRANSACTIONS : references
    AUTH_USERS ||--o{ AUDIT_LOGS : acts_in

    PROFILES {
      uuid id PK
      text university_id UK
      text full_name
      text email
      integer max_credit_load
    }
    USER_ROLES {
      uuid user_id PK
      app_role role
    }
    TERMS {
      uuid id PK
      text code UK
      date starts_on
      date ends_on
      timestamptz registration_opens_at
      timestamptz registration_closes_at
    }
    COURSES {
      uuid id PK
      text code UK
      text title
      integer credits
      text department
    }
    COURSE_SECTIONS {
      uuid id PK
      uuid term_id FK
      uuid course_id FK
      text section_code
      integer capacity
      integer enrolled_count
      text instructor_name
    }
    REGISTRATIONS {
      uuid id PK
      uuid student_id FK
      uuid section_id FK
      registration_status status
      timestamptz registered_at
    }
    WAITLIST_ENTRIES {
      uuid id PK
      uuid student_id FK
      uuid section_id FK
      integer position
    }
    AUDIT_LOGS {
      bigint id PK
      uuid actor_id FK
      text action
      text outcome
      timestamptz occurred_at
    }
```

## 5.6 UI design scheme

```mermaid
flowchart LR
    P[Public landing page] --> L[Local sign-in / university SSO]
    P --> D[Safe role previews]
    L --> R{Trusted database role}
    R --> S[Student workspace]
    R --> F[Faculty workspace]
    R --> G[Registrar workspace]
    R --> A[Administrator workspace]
    S --> S1[Overview]
    S --> S2[Course catalogue]
    S --> S3[Schedule]
    S --> S4[Waitlist]
    S --> S5[Payments]
    F --> F1[Classes / rosters / schedule]
    G --> G1[Offerings / registration / reports]
    A --> A1[Users / health / audit]
```

The visual system uses a calm teal/mint base with blue, gold, and rose status accents,
rounded cards, visible focus indicators, responsive navigation, and text labels in
addition to colour. The full implementation is in `src/app/globals.css`.

