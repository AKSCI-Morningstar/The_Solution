# Engineering Ontology Specification
**Morningstar Knowledge Model and Semantic Architecture**

---

## 1. Executive Summary

This document defines the formal **Engineering Ontology** for Morningstar. Morningstar is an advanced engineering intelligence platform operating in high-consequence, multi-disciplinary aerospace and systems engineering domains. 

In modern aerospace development, data fragmentation across engineering siloes, supply chains, physical testing regimes, and regulatory standards often obscures critical contradictions. The Morningstar Engineering Ontology bridges these chasms by modeling real-world physical systems, organizational hierarchies, compliance baselines, and engineering reasoning processes as a unified semantic graph.

This ontology provides the semantic foundation for:
1. **Dynamic Traceability**: Continuous, cross-boundary lineage from regulatory mandates to individual physical part serial numbers.
2. **Automated Reasoning & Contradiction Detection**: Programmatic checking of multi-domain assertions (e.g., matching physical test outcomes against structural strength requirements).
3. **Decentralized Knowledge Capture**: Structuring unstructured engineering decisions, meeting outcomes, and expert assessments into persistent historical precedents.

---

## 2. Core Entities

The core entities represent the fundamental structural, process, and administrative components of Morningstar's physical and digital engineering universe.

### 2.1 Project
- **Definition**: A focused engineering initiative with a defined scope, schedule, and resource allocation aimed at delivering a specific product, system, or milestone.
- **Purpose**: To group, budget, and manage activities and deliverables within a program.
- **Key Attributes**:
  - `project_id` (Unique Identifier)
  - `name` (String)
  - `status` (Enum: INITIATION, PLANNING, EXECUTION, CLOSEOUT, SUSPENDED)
  - `budget_allocation` (Value & Currency)
  - `start_date` (Date)
  - `end_date` (Date)
- **Typical Lifecycle**:
  `CONCEPT` $\rightarrow$ `INITIATED` $\rightarrow$ `ACTIVE` $\rightarrow$ `PAUSED` $\rightarrow$ `COMPLETED` $\rightarrow$ `ARCHIVED`

### 2.2 Program
- **Definition**: A portfolio of interconnected projects managed in a coordinated manner to achieve strategic enterprise goals, typically corresponding to an entire aerospace platform (e.g., Orbital Launch Vehicle Program).
- **Purpose**: Provides high-level strategic alignment, cross-project resource planning, and regulatory compliance oversight.
- **Key Attributes**:
  - `program_id` (Unique Identifier)
  - `name` (String)
  - `mission_profile` (Textual description of operational parameters)
  - `program_manager` (Reference)
  - `status` (Enum: PROPOSAL, ACTIVE, PHASE_OUT, TERMINATED)
- **Typical Lifecycle**:
  `STRATEGIC_PLANNING` $\rightarrow$ `ACTIVE_DEVELOPMENT` $\rightarrow$ `OPERATIONAL` $\rightarrow$ `LEGACY_SUPPORT` $\rightarrow$ `DECOMMISSIONED`

### 2.3 Requirement
- **Definition**: A singular, verifiable statement specifying a physical capability, performance metric, environmental tolerance, constraint, or interface relationship that a system must satisfy.
- **Purpose**: Establishes the contract of "what" must be built, serving as the baseline for all design, manufacturing, and verification activities.
- **Key Attributes**:
  - `requirement_id` (Unique Identifier)
  - `text` (String)
  - `priority` (Enum: CRITICAL, HIGH, MEDIUM, LOW)
  - `verification_method` (Enum: ANALYSIS, DEMONSTRATION, INSPECTION, TEST)
  - `status` (Enum: DRAFT, UNDER_REVIEW, APPROVED, DEPRECATED)
  - `version` (Semantic Version)
- **Typical Lifecycle**:
  `PROPOSED` $\rightarrow$ `DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `SUPERSEDED` / `RETIRED`

### 2.4 Component
- **Definition**: A functional subdivision of a system or assembly, consisting of multiple parts, which performs a specific, distinct function (e.g., Avionics Flight Computer).
- **Purpose**: Organizes complex systems into modular, assignable, and testable sub-systems.
- **Key Attributes**:
  - `component_id` (Unique Identifier)
  - `name` (String)
  - `functional_description` (Text)
  - `mass_target` (Weight in kg)
  - `envelope_dimensions` (Volumetric bounding box)
- **Typical Lifecycle**:
  `CONCEPTUAL_DESIGN` $\rightarrow$ `PRELIMINARY_DESIGN` $\rightarrow$ `DETAILED_DESIGN` $\rightarrow$ `PROTOTYPING` $\rightarrow$ `QUALIFICATION` $\rightarrow$ `PRODUCTION` $\rightarrow$ `IN_SERVICE`

### 2.5 Assembly
- **Definition**: An structured configuration of parts and/or components integrated to form a self-contained, high-level functional unit (e.g., Gimbaled Thrust Assembly).
- **Purpose**: Serves as the structural linking node in the system hierarchy, defining physical, mechanical, and electrical interfaces.
- **Key Attributes**:
  - `assembly_id` (Unique Identifier)
  - `part_number` (String)
  - `drawing_reference` (Document Reference)
  - `bom_level` (Integer representing Bill of Materials depth)
- **Typical Lifecycle**:
  `DESIGN_RELEASE` $\rightarrow$ `FABRICATION` $\rightarrow$ `INTEGRATION` $\rightarrow$ `SYSTEM_TESTING` $\rightarrow$ `DEPLOYMENT`

### 2.6 Part
- **Definition**: The lowest-level, indivisible physical item or material unit in the system hierarchy that cannot be disassembled without losing its identity (e.g., Titanium Bolt, High-Temp O-Ring).
- **Purpose**: Specifies raw materials, commercial-off-the-shelf (COTS) items, and fabricated elements for production and procurement.
- **Key Attributes**:
  - `part_id` (Unique Identifier)
  - `material_spec` (Standard reference)
  - `serial_number` (String, optional for traceable batches)
  - `mass_actual` (Weight in kg)
- **Typical Lifecycle**:
  `SPECIFIED` $\rightarrow$ `SOURCED` $\rightarrow$ `INSPECTED` $\rightarrow$ `STOCKED` $\rightarrow$ `INSTALLED` $\rightarrow$ `RETIRED`

### 2.7 Supplier
- **Definition**: An external corporate entity contracted to deliver parts, materials, components, software, or specialized services to Morningstar.
- **Purpose**: Tracks manufacturing capability, commercial terms, compliance standing, and delivery risks.
- **Key Attributes**:
  - `supplier_id` (Unique Identifier)
  - `legal_name` (String)
  - `cage_code` (String - for defense contracting)
  - `duns` (String - Data Universal Numbering System)
  - `risk_rating` (Enum: LOW, MEDIUM, HIGH, CRITICAL)
- **Typical Lifecycle**:
  `ONBOARDING` $\rightarrow$ `QUALIFIED` $\rightarrow$ `ACTIVE` $\rightarrow$ `PROBATION` $\rightarrow$ `SUSPENDED` $\rightarrow$ `DEBARRED`

### 2.8 Facility
- **Definition**: A distinct physical location, plant, building, or laboratory operated by Morningstar or its suppliers where design, manufacturing, assembly, testing, or storage occurs.
- **Purpose**: Establishes geographic and structural constraints on production, security clearance boundaries, and environmental calibration controls.
- **Key Attributes**:
  - `facility_id` (Unique Identifier)
  - `name` (String)
  - `location` (Geospatial coordinates & address)
  - `cleanroom_class` (ISO rating, if applicable)
  - `security_level` (String)
- **Typical Lifecycle**:
  `COMMISSIONED` $\rightarrow$ `OPERATIONAL` $\rightarrow$ `MAINTENANCE` $\rightarrow$ `DECOMMISSIONED`

### 2.9 Engineer
- **Definition**: A certified technical professional within Morningstar authorized to author requirements, perform designs, execute analyses, run tests, and sign off on engineering decisions.
- **Purpose**: Tracks professional accountability, signing authority, organizational responsibilities, and skill profiles.
- **Key Attributes**:
  - `engineer_id` (Unique Identifier)
  - `name` (String)
  - `role_title` (String)
  - `clearance_level` (String)
  - `signature_authority_limit` (Value threshold)
- **Typical Lifecycle**:
  `PROVISIONED` $\rightarrow$ `ACTIVE` `AUTHORIZED` $\rightarrow$ `SUSPENDED` $\rightarrow$ `INACTIVE`

### 2.10 Team
- **Definition**: A collaborative group of engineers and specialists aligned under a specific discipline, sub-system, or project phase (e.g., Propulsion Design Team, Guidance Navigation & Control Team).
- **Purpose**: Governs ownership and responsibility boundaries for components, requirements, and workflows.
- **Key Attributes**:
  - `team_id` (Unique Identifier)
  - `name` (String)
  - `lead_engineer` (Reference)
  - `discipline` (Enum: STRUCTURES, AVIONICS, PROPULSION, COMPLIANCE, SOFTWARE)
- **Typical Lifecycle**:
  `CHARTERED` $\rightarrow$ `OPERATIONAL` $\rightarrow$ `REORGANIZED` $\rightarrow$ `DISBANDED`

### 2.11 Standard
- **Definition**: A formally documented, industry-recognized set of criteria, processes, methods, or limits established by authoritative bodies (e.g., ASME, NASA-STD, MIL-SPEC, ISO).
- **Purpose**: Ensures consistent quality, safety, and compatibility of aerospace systems.
- **Key Attributes**:
  - `standard_id` (Unique Identifier)
  - `issuing_organization` (e.g., AIAA, SAE, DoD)
  - `document_code` (e.g., DO-178C)
  - `revision_level` (String)
- **Typical Lifecycle**:
  `PROPOSED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ACTIVE` $\rightarrow$ `UNDER_REVISION` $\rightarrow$ `SUPERSEDED` $\rightarrow$ `WITHDRAWN`

### 2.12 Regulation
- **Definition**: A legally binding mandate, rule, or restriction promulgated by a government body (e.g., FAA Part 25, ITAR, EAR) that must be met to operate or export systems legally.
- **Purpose**: Dictates legal constraints, export compliance criteria, and safety certification bounds.
- **Key Attributes**:
  - `regulation_id` (Unique Identifier)
  - `governing_body` (e.g., FAA, Department of State)
  - `legal_citation` (e.g., 14 CFR Part 450)
  - `export_control_classification` (e.g., ECCN, USML Category)
- **Typical Lifecycle**:
  `PROPOSED` $\rightarrow$ `ENFORCED` $\rightarrow$ `AMENDED` $\rightarrow$ `REPEALED`

### 2.13 Certification
- **Definition**: A formal statement, license, or credential issued by an internal or external authority confirming that a physical part, facility, process, or engineer meets specific standards or regulations.
- **Purpose**: Establishes structural trust, permission to operate, and compliance clearance.
- **Key Attributes**:
  - `certification_id` (Unique Identifier)
  - `scope` (Text describing boundary of certification)
  - `issuing_body` (Reference to standard or government agency)
  - `expiration_date` (Date)
- **Typical Lifecycle**:
  `APPLICATION_SUBMITTED` $\rightarrow$ `PENDING_AUDIT` $\rightarrow$ `ISSUED` $\rightarrow$ `ACTIVE` $\rightarrow$ `EXPIRED` $\rightarrow$ `REVOKED`

### 2.14 Test
- **Definition**: A defined, planned physical execution, simulation, or laboratory procedure designed to evaluate, verify, or validate a Component, Assembly, or Part against designated Requirements.
- **Purpose**: Gathers physical evidence to verify design limits, safety margins, and structural integrity.
- **Key Attributes**:
  - `test_id` (Unique Identifier)
  - `type` (Enum: DEVELOPMENT, QUALIFICATION, ACCEPTANCE)
  - `procedure_reference` (Document Reference)
  - `environmental_conditions` (Text details)
- **Typical Lifecycle**:
  `PLANNED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `READY_FOR_TEST` $\rightarrow$ `EXECUTED` $\rightarrow$ `ANALYZED` $\rightarrow$ `CLOSED_OUT`

### 2.15 Evidence
- **Definition**: An immutable record of data, outcomes, or verification artifacts collected during a Test, Audit, or Inspection that supports or refutes an engineering claim or requirement compliance.
- **Purpose**: Provides verifiable ground truth for engineering decisions and regulatory audits.
- **Key Attributes**:
  - `evidence_id` (Unique Identifier)
  - `data_payload` (Structured URI/Blob link)
  - `timestamp` (DateTime)
  - `hash` (SHA-256 for integrity verification)
  - `pass_fail_status` (Boolean)
- **Typical Lifecycle**:
  `CAPTURED` $\rightarrow$ `CRYPTOGRAPHICALLY_SIGNED` $\rightarrow$ `VERIFIED` $\rightarrow$ `ARCHIVED`

### 2.16 Document
- **Definition**: Any formal, version-controlled unit of written, drawn, or synthesized information used to capture designs, guidelines, results, or processes (e.g., 2D Drawing, Structural Analysis Report).
- **Purpose**: Serves as the primary human-and-machine-readable medium for knowledge exchange and formal baseline control.
- **Key Attributes**:
  - `document_id` (Unique Identifier)
  - `title` (String)
  - `format` (e.g., PDF, STEP, XML)
  - `classification` (Enum: PUBLIC, PROPRIETARY, CONFIDENTIAL, SECRET)
- **Typical Lifecycle**:
  `DRAFT` $\rightarrow$ `COLLABORATIVE_EDITING` $\rightarrow$ `FORMAL_REVIEW` $\rightarrow$ `APPROVED_RELEASE` $\rightarrow$ `SUPERSEDED`

### 2.17 Engineering Decision
- **Definition**: A formal, documented selection of a course of action, design path, risk waiver, or trade-off made by an authorized engineer or board.
- **Purpose**: Resolves contradictions, approves design baselines, and authorizes departures from established requirements.
- **Key Attributes**:
  - `decision_id` (Unique Identifier)
  - `rationale` (Text)
  - `impact_scope` (Text list of affected assemblies or systems)
  - `sign_off_authority` (Reference to Engineer or Board)
- **Typical Lifecycle**:
  `PROPOSED` $\rightarrow$ `UNDER_ASSESSMENT` $\rightarrow$ `DISSENT_REGISTERED` $\rightarrow$ `APPROVED_SIGN_OFF` $\rightarrow$ `ENFORCED` $\rightarrow$ `SUPERSEDED`

### 2.18 Change Request
- **Definition**: A formal proposal to modify an approved Requirement, Component, Assembly, Part, or baseline Document.
- **Purpose**: Controls and traces changes, assessing cost, schedule, risk, and technical impacts before execution.
- **Key Attributes**:
  - `change_request_id` (Unique Identifier)
  - `reason_for_change` (Text)
  - `impact_level` (Enum: CLASS_I_MAJOR, CLASS_II_MINOR)
  - `disposition` (Enum: PENDING, APPROVED, REJECTED, DEFERRED)
- **Typical Lifecycle**:
  `SUBMITTED` $\rightarrow$ `TECHNICAL_REVIEW` $\rightarrow$ `BOARD_REVIEW` $\rightarrow$ `IMPLEMENTING` $\rightarrow$ `VERIFIED` $\rightarrow$ `CLOSED`

### 2.19 Failure
- **Definition**: The unacceptable departure of a physical Part, Assembly, or Component from its expected functional performance, or structural collapse during test or operation.
- **Purpose**: Initiates non-conformance logging, root cause analysis, and containment activities.
- **Key Attributes**:
  - `failure_id` (Unique Identifier)
  - `failure_mode` (e.g., Thermal Runaway, Fatigue Fracture)
  - `severity_index` (Criticality scale from 1-10)
  - `detection_mechanism` (Text)
- **Typical Lifecycle**:
  `LOGGED` $\rightarrow$ `CONTAINED` $\rightarrow$ `ROOT_CAUSE_INVESTIGATION` $\rightarrow$ `CORRECTED` $\rightarrow$ `CLOSED`

### 2.20 Risk
- **Definition**: An uncertain event or condition that, if it occurs, has a negative impact on a program's safety, cost, schedule, or technical performance (e.g., supply chain delivery slip, structural weight growth).
- **Purpose**: Identifies potential hazards to actively plan mitigation strategies and track hazard exposure.
- **Key Attributes**:
  - `risk_id` (Unique Identifier)
  - `probability` (Scale 1-5)
  - `consequence` (Scale 1-5)
  - `risk_score` (Integer: Product of Probability and Consequence)
  - `mitigation_strategy` (Text)
- **Typical Lifecycle**:
  `IDENTIFIED` $\rightarrow$ `ASSESSED` $\rightarrow$ `MITIGATION_ACTIVE` $\rightarrow$ `REALIZED_TO_ISSUE` $\rightarrow$ `RETIRED`

### 2.21 Issue
- **Definition**: A current, realized problem that is actively impacting project execution, safety, or compliance (often a realized Risk).
- **Purpose**: Drives near-term resource allocation and corrective action planning to minimize operational disruption.
- **Key Attributes**:
  - `issue_id` (Unique Identifier)
  - `impact_description` (Text)
  - `assignee` (Reference)
  - `target_resolution_date` (Date)
- **Typical Lifecycle**:
  `OPEN` $\rightarrow$ `CONTAINED` $\rightarrow$ `RESOLVING` $\rightarrow$ `VERIFIED_RESOLVED` $\rightarrow$ `CLOSED`

### 2.22 Corrective Action
- **Definition**: A documented, authorized action plan executed to eliminate the root cause of an identified Failure, non-conformance, or Issue to prevent recurrence.
- **Purpose**: Closes the loop on failures, forcing systemic fixes across designs, processes, or suppliers.
- **Key Attributes**:
  - `corrective_action_id` (Unique Identifier)
  - `root_cause_findings` (Text)
  - `action_items` (List of tasks)
  - `implementation_deadline` (Date)
- **Typical Lifecycle**:
  `PROPOSED` $\rightarrow$ `APPROVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `UNDER_VERIFICATION` $\rightarrow$ `COMPLETED_EFFECTIVE`

### 2.23 Audit
- **Definition**: A systematic, independent evaluation of physical facilities, manufacturing processes, safety procedures, software source code, or supplier operations against defined requirements and standards.
- **Purpose**: Verifies that operational reality matches documented procedures and regulatory rules.
- **Key Attributes**:
  - `audit_id` (Unique Identifier)
  - `scope` (Text)
  - `lead_auditor` (Reference)
  - `findings` (List of non-conformance references)
- **Typical Lifecycle**:
  `SCHEDULED` $\rightarrow$ `PREPARATION` $\rightarrow$ `ON_SITE` $\rightarrow$ `REPORT_ISSUED` $\rightarrow$ `REMEDIAL_FOLLOW_UP` $\rightarrow$ `CLOSED`

### 2.24 Customer
- **Definition**: The internal or external organization, government agency, or commercial partner that defines strategic operational needs, funds development programs, and accepts final system delivery (e.g., NASA, Commercial Satellite Operator).
- **Purpose**: Defines top-level missions and accepts final engineering evidence for system delivery approval.
- **Key Attributes**:
  - `customer_id` (Unique Identifier)
  - `organization_name` (String)
  - `contract_authority` (String)
  - `acceptance_criteria` (Reference to standard/document)
- **Typical Lifecycle**:
  `PROSPECT` $\rightarrow$ `CONTRACTED_PARTNER` $\rightarrow$ `ACTIVE_OPERATIONS` $\rightarrow$ `ARCHIVED_CLIENT`

---

## 3. Relationships

Engineering knowledge does not live in static nodes; it resides in the structural and semantic links between nodes. The following table codifies the core relationships within the Morningstar Engineering Ontology.

| Source Entity | Relationship Verb | Target Entity | Cardinality | Semantic Description |
| :--- | :--- | :--- | :--- | :--- |
| **Program** | `contains` | **Project** | $1 : N$ | Deconstructs a high-level aerospace platform into trackable, funded development phases. |
| **Project** | `targets` | **Component** | $N : M$ | Connects a specific project team's execution scope to the engineering hardware or software systems. |
| **Requirement** | `applies to` | **Component** | $N : M$ | Allocates specific technical mandates and environmental criteria directly to physical subsystems. |
| **Component** | `composed of` | **Assembly** | $1 : N$ | Defines hierarchical structural assembly decompositions (Product Breakdown Structure). |
| **Assembly** | `includes` | **Part** | $1 : N$ | Establishes the precise Bill of Materials (BOM) hierarchy of physical hardware. |
| **Supplier** | `supplies` | **Component** | $N : M$ | Identifies external manufacturing ownership for components, exposing supply chain risk. |
| **Supplier** | `operates` | **Facility** | $1 : N$ | Maps the physical workspace locations and environmental capabilities of suppliers. |
| **Engineer** | `belongs to` | **Team** | $N : M$ | Defines the organizational division and cross-functional engineering matrix. |
| **Team** | `owns` | **Component** | $1 : N$ | Assigns ultimate design authority and sign-off accountability for structural components. |
| **Document** | `references` | **Standard** | $N : M$ | Declares which structural, electrical, or software industry baselines are incorporated into a design. |
| **Requirement** | `derived from` | **Regulation** | $N : M$ | Establishes the direct lineage from governmental regulatory safety standards to technical design criteria. |
| **Requirement** | `verified by` | **Test** | $N : M$ | Maps technical criteria to corresponding verification actions, checking validation coverage. |
| **Test** | `produces` | **Evidence** | $1 : N$ | Collects physical telemetry, inspection reports, and data logs from structural executions. |
| **Evidence** | `supports` | **Engineering Decision** | $N : M$ | Backs up architectural choices, waivers, or design signs-offs with empirical data. |
| **Failure** | `impacts` | **Component** | $N : M$ | Pinpoints exactly which systems, sub-assemblies, or physical parts were affected by non-conformances. |
| **Failure** | `triggers` | **Corrective Action** | $1 : N$ | Enforces formal root cause investigations and programmatic fixes in response to physical test anomalies. |
| **Corrective Action** | `resolves` | **Issue** | $N : M$ | Links realized problems to their verified physical or digital resolutions. |
| **Risk** | `threatens` | **Assembly** | $N : M$ | Highlights potential failure points, structural stress limitations, or component environmental vulnerabilities. |
| **Audit** | `evaluates` | **Facility** | $N : M$ | Documents periodic quality and physical capability assessments of manufacturing sites. |
| **Engineering Decision** | `creates` | **Historical Precedent** | $1 : 1$ | Converts complex engineering design sign-offs into searchable, legally defensible precedents for future reuse. |
| **Customer** | `funds` | **Program** | $1 : N$ | Tracks contract funding boundaries and high-level delivery accountability. |

---

## 4. Evidence Taxonomy

To prevent data corruption, blind spots, or cognitive bias in aerospace programs, Morningstar classifies all inputs into a rigorous **Evidence Taxonomy**. Evidence is evaluated based on its provenance, structured representation, and weight in proving compliance.

```
                  ┌─────────────────────────────────────────┐
                  │            EVIDENCE TAXONOMY            │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ EMPIRICAL DATA   │          │ COMPLIANCE DATA  │          │ OPERATIONAL DATA │
│ (High Weight)    │          │ (Medium Weight)  │          │ (Low/Supp. Weight│
└────────┬─────────┘          └────────┬─────────┘          └────────┬─────────┘
         ├─ Test Reports               ├─ Certifications             ├─ Emails
         ├─ Inspection Records         ├─ Audit Reports              ├─ Meeting Minutes
         └─ CAD/STEP Models            └─ Manufacturer Datasheets    └─ Slack/Chat Logs
```

### 4.1 Empirical Data (High Evidentiary Weight)
*Direct, physically measured or rigorously modeled verification results.*

1. **Test Reports**: Structured performance data, environmental chamber sensor logs, telemetry streams, and stress-strain graphs.
   - *Contribution*: Serves as direct proof of physical performance. Validates safety margins, material limits, and thermal tolerances.
2. **Inspection Records**: Non-destructive evaluation (NDE) results (e.g., X-ray, ultrasonic scans, dye penetrant), dimensional inspection logs, and metrology scans.
   - *Contribution*: Confirms physical parts conform exactly to drawing tolerances and are free of manufacturing defects before integration.
3. **CAD & STEP Models**: Volumetric boundary representations, electrical wire routing schemas, and mechanical structural assemblies.
   - *Contribution*: Represents spatial ground truth, allowing automated validation of volumetric interfaces and physical envelope clearances.

### 4.2 Compliance & Authority Data (Medium Evidentiary Weight)
*Certificates, third-party attestations, and documented standards.*

1. **Certifications (AS9100, Nadcap, FAA Form 8130)**: Verification certificates issued by accredited third parties or government authorities.
   - *Contribution*: Provides a foundation of trust regarding manufacturing capability, material authenticity, or software design standards.
2. **Audit Reports**: Independent, systematic reviews of supply chain facilities, process controls, or source code.
   - *Contribution*: Highlights systemic quality trends, revealing operational or physical vulnerabilities before hardware failure occurs.
3. **Manufacturer Datasheets & Supplier COAs (Certificate of Analysis)**: Material composition lists, performance bounds, and chemical purity declarations of raw materials.
   - *Contribution*: Tracks traceability of material chemistry back to the foundry melt, mitigating counterfeit part risks.

### 4.3 Operational & Relational Data (Low/Supplementary Weight)
*Unstructured communication, contextual logs, and contextual interactions.*

1. **Emails & Chat History (Slack/Teams)**: Logged communications between suppliers, design engineers, and systems leads.
   - *Contribution*: Provides essential contextual history of engineering disagreements, requirements clarifications, or raw assumptions before formal changes occur.
2. **Meeting Minutes (Design Reviews)**: Summaries of Preliminary Design Reviews (PDR), Critical Design Reviews (CDR), and Material Review Board (MRB) deliberations.
   - *Contribution*: Documents consensus, alternate design options explored, and minority dissenting opinions. Helps avoid repeating previous design mistakes.
3. **Engineering Notes / Scratchpads**: Unreleased calculations, preliminary thermal studies, and rough modeling experiments.
   - *Contribution*: Offers early insight into design trade-offs, preventing lost knowledge when engineers change teams.

---

## 5. Decision Lifecycle

The Morningstar **Decision Lifecycle** structures engineering processes to ensure that all decisions are logical, verifiable, and permanent. It moves from initial inquiries to structured historical knowledge, resolving contradictions along the way.

```
   [ 1. QUESTION ]
          │  Identify target assemblies, requirements, or physical issues.
          ▼
   [ 2. EVIDENCE ]
          │  Ingest sensor logs, certifications, CAD models, and test procedures.
          ▼
[ 3. CONTRADICTIONS ] ◄─── Is there a conflict? (e.g., test fails vs. req states "must pass")
          │  YES: Flag conflict, block downstream approval.
          │  NO
          ▼
[ 4. MISSING INFO ] ◄─── Are critical fields or parent nodes missing?
          │  YES: Pause lifecycle, trigger targeted supplier or engineering requests.
          │  NO
          ▼
  [ 5. ASSESSMENT ]
          │  Synthesize evidence, run physical simulations, document findings.
          ▼
[ 6. ENG DECISION ]
          │  Formal sign-off of design, waiver, or corrective action by authority.
          ▼
[ 7. HIST PRECEDENT ]
             Publish to semantic knowledge graph, creating a searchable precedent.
```

### Stage 1: Question
- **Activity**: Formulating an inquiry, system upgrade, physical failure investigation, or design trade-off study.
- **Example**: *"Can our composite fuselage skin handle aerodynamic heating up to 180°C during flight without material degradation?"*
- **Entities Involved**: `Component`, `Requirement`, `Engineer`, `Failure` (if failure-triggered).

### Stage 2: Evidence Gathering
- **Activity**: Querying the knowledge graph to aggregate relevant physical, compliance, and process evidence.
- **Example**: Retrieving chemical composition certificates, physical thermal stress test logs, and simulation studies for composite material batches.
- **Entities Involved**: `Evidence`, `Test`, `Document`, `Standard`.

### Stage 3: Contradiction Detection
- **Activity**: Programmatic analysis of assertions in the evidence pool to detect contradictions.
- **Example**: Detecting a conflict where a supplier-submitted coupon test records material delamination starting at 165°C, while the design specification document claims safety limits up to 190°C.
- **Ontology Rule**: If a contradiction is detected, the status must flag `BLOCKED_CONTRADICTION`, triggering a physical notification to the owning `Team`.
- **Entities Involved**: `Evidence`, `Requirement`, `Document`.

### Stage 4: Missing Information Identification
- **Activity**: Validating node completeness. The system scans the semantic graph for missing attributes or empty relations.
- **Example**: Identifying that the composite material batch is missing its mandatory third-party Nadcap thermal curing certification or has no linked manufacturer test report.
- **Ontology Rule**: Block progression to the assessment stage if essential verification data is missing.
- **Entities Involved**: `Evidence`, `Certification`, `Supplier`.

### Stage 5: Synthesis & Assessment
- **Activity**: Technical analysis of the contradictions and missing information by qualified engineers.
- **Example**: Running localized thermal finite element analysis (FEA) to determine if structural margins remain acceptable despite localized lower delamination limits.
- **Entities Involved**: `Engineer`, `Team`, `Test` (Simulation), `Document` (Analysis Report).

### Stage 6: Engineering Decision & Sign-off
- **Activity**: Formally approving a path forward, authorizing a design deviation, or initiating a material change.
- **Example**: Approving a technical deviation to reduce operational temperature limits to 160°C or re-sourcing composite layers from an alternate qualified supplier.
- **Ontology Rule**: Requires cryptographic sign-off from an `Engineer` possessing the required signature authority.
- **Entities Involved**: `Engineering Decision`, `Change Request`, `Engineer`.

### Stage 7: Historical Precedent Serialization
- **Activity**: Serializing the complete decision, including all supporting evidence and resolved contradictions, into an immutable node in the Morningstar knowledge graph.
- **Example**: Generating a searchable, relational historical precedent. Future design teams working on thermal composite skins can query this precedent to instantly understand material behavior and previous engineering boundaries.
- **Entities Involved**: `Historical Precedent`, `Standard`.

---

## 6. Standardized Vocabulary (Glossary)

To ensure consistency across teams, suppliers, and algorithms, the following terms are codified as standard:

- **BOM (Bill of Materials)**: A comprehensive hierarchical list of physical parts, raw materials, fasteners, and sub-assemblies required to manufacture, build, or repair an assembly.
- **COTS (Commercial Off-The-Shelf)**: Standard products or parts manufactured in high volume by external suppliers that do not require custom engineering or specialized design modifications for Morningstar.
- **Traceability**: The ability to reconstruct the complete historical lineage, origin, manufacturing facility, test records, and design revisions of a physical part or software component from raw materials to final operation.
- **Verification**: The technical process of proving that a physical system, subsystem, or part meets its designated design and requirement baseline (*"We built the system right"*).
- **Validation**: The process of confirming that a completed, integrated system satisfies its high-level mission goals, operator profiles, and customer needs under realistic conditions (*"We built the right system"*).
- **Non-Conformance**: A physical part, raw material, process, or software build that fails to meet design drawings, material specifications, quality rules, or compliance standards.
- **Qualification**: The rigorous environmental, structural, and electromagnetic testing of a component to prove it can survive the harshest environments (vacuum, thermal shock, high vibration) before being cleared for launch.
- **Acceptance Testing**: The standard suite of physical and functional tests executed on every production unit to verify basic performance and find manufacturing defects before flight delivery.
- **Nadcap (National Aerospace and Defense Contractors Accreditation Program)**: A global, industry-controlled cooperative program of major aerospace companies that manages the technical quality accreditation of special processes (e.g., heat treating, non-destructive testing, chemical processing).
- **CAGE Code (Commercial and Government Entity Code)**: A unique five-character identifier assigned by the Defense Logistics Agency (DLA) to commercial suppliers seeking to perform defense-related contracting.

---

## 7. Future Expansion

The ontology is designed as an open semantic graph, allowing modular expansion without breaking the core schema.

```
       ┌────────────────────────────────────────────────────────┐
       │                CORE MORNINGSTAR ONTOLOGY               │
       │  (Project, Component, Requirement, Supplier, Test...) │
       └───────────────────────────┬────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌──────────────────┐                                ┌──────────────────┐
│ SUSTAINABILITY   │                                │  FLEET OPERATIONS │
│ (Future Phase)   │                                │  (Future Phase)  │
└────────┬─────────┘                                └────────┬─────────┘
         ├─ CarbonFootprint                                  ├─ TelemetryStream
         ├─ RecyclabilityIndex                               ├─ FlightEvent
         └─ MaterialOrigin                                   └─ MaintenanceLog
```

### 7.1 Sustainability Module
- **Purpose**: Tracks environmental impacts, carbon footprints, recyclability, and chemical restrictions across the supply chain.
- **New Entities**:
  - `CarbonFootprint`: Calculated environmental impact (in $CO_2$ equivalents) of raw materials and manufacturing processes.
  - `RecyclabilityIndex`: Mathematical classification score of material recoverability.
  - `MaterialOrigin`: Geolocation tracking of raw ore extraction and chemical refining.
- **New Relationships**:
  - `Part` $\rightarrow$ `has_footprint` $\rightarrow$ `CarbonFootprint`
  - `Supplier` $\rightarrow$ `implements_process` $\rightarrow$ `RecyclabilityIndex`

### 7.2 Fleet & Mission Operations Module
- **Purpose**: Bridges manufacturing history with real-time operational flight metrics to establish comprehensive lifecycle tracking.
- **New Entities**:
  - `TelemetryStream`: Time-series sensor data streams captured during actual launch, orbit, and return phases.
  - `FlightEvent`: Specific events (e.g., Main Engine Cutoff, Max Q, fairing separation) recorded during operation.
  - `MaintenanceLog`: Records of teardowns, structural inspections, component replacements, and refurbishments between reuse cycles.
- **New Relationships**:
  - `Component` $\rightarrow$ `generates` $\rightarrow$ `TelemetryStream` (during active flights).
  - `FlightEvent` $\rightarrow$ `stresses` $\rightarrow$ `Assembly` (linking physical dynamic loads directly back to CAD design load models).
  - `MaintenanceLog` $\rightarrow$ `verifies_state` $\rightarrow$ `Component`.
