# Incident Development Standard

Use a correlation ID from report through logs, traces, audit evidence, mitigation, and follow-up. Do not copy sensitive payloads into the incident record. Assign severity and incident commander under the ratified policy, preserve evidence, limit emergency access by role and time, and record every production action.

Prefer reversible traffic/feature controls before code changes. An emergency artifact must be immutable, reviewed, smoke-tested, and deployed through the normal environment role. Record the prior digest as the rollback target. After stabilization, complete root-cause analysis, customer/restaurant impact, corrective tests, runbook updates, access review, and accountable closure.
