# Contributing

New rules and fixes to existing ones are welcome. A rule gets merged when it catches a real bug class, has tests for both the vulnerable and the safe forms, and passes CI.

## Before you write a rule

Search [semgrep/semgrep-rules](https://github.com/semgrep/semgrep-rules) and the [Semgrep registry](https://semgrep.dev/r) for the pattern first. If a community rule already covers it well, improve that rule upstream instead. If yours catches cases the community rule misses, say which ones in the `registry-comparison` metadata field.

Write test samples as generic code. Don't paste code, configs or incident details from an employer or a client.

## Add a rule

1. Pick the folder by technology, for example `rules/python/fastapi/` or `rules/github-actions/`.

2. Write the test file first, next to where the rule will go, with the same name as the rule and the target language's extension: `my-rule.py`, `my-rule.js`, or `my-rule.test.yaml` for workflow rules. Put `# ruleid: my-rule` (or `// ruleid: my-rule`) on the line above each sample that must produce a finding, and `ok: my-rule` above each sample that must not. Include at least one safe sample that looks close to the vulnerable one, such as the fixed version of the same code.

3. Write `my-rule.yaml` with these fields:

   ```yaml
   rules:
     - id: my-rule               # same as the file name
       languages: [python]       # use js and ts for JavaScript and TypeScript
       severity: ERROR           # ERROR, WARNING or INFO
       message: >-
         What the code does wrong, what an attacker can do with it, and how to fix it,
         with a short code example of the fix.
       metadata:
         category: security
         subcategory: [vuln]     # or [audit] when the rule can't tell if input is untrusted
         cwe:
           - "CWE-918: Server-Side Request Forgery (SSRF)"
         owasp:
           - A10:2021 - Server-Side Request Forgery (SSRF)
         confidence: MEDIUM      # LOW, MEDIUM or HIGH
         likelihood: MEDIUM
         impact: HIGH
         technology: [fastapi]
         references:
           - https://cheatsheetseries.owasp.org/
         registry-comparison: >-
           The closest community rule and what it misses.
   ```

   Use taint mode (`mode: taint`) when the bug depends on untrusted input reaching a dangerous call. Use pattern matching when the code shape alone is the bug.

4. Run the checks from the repository root and fix anything they report:

   ```sh
   semgrep --validate --metrics=off --config rules/
   semgrep --test --metrics=off rules/
   sh scripts/lint-rules.sh
   ```

5. Add the rule to the table in the README.

## Write the message for the developer

The message is what a developer reads in a pull request comment, often with no security background. Name the problem in this code, give one concrete consequence, and show the fix. Skip general advice that would fit any finding.

## Pull requests

Keep one rule, or one fix, per pull request. Say in the description what the rule catches and what you tested. CI must pass before a merge.
