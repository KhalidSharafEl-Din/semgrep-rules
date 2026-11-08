# Security policy

## Reporting a vulnerability

Email security@khalidsharafeldin.com. Please don't open a public issue for a security problem.

Include the file and rule ID, what you found, and a way to reproduce it. I'll reply within 7 days and keep you updated until it's fixed.

## What counts

This repository holds Semgrep rules, test samples and a CI workflow. These count as security problems here:

- A weakness in the CI workflow, such as a way to run code with a write token or read a secret.
- A rule that reports a dangerous pattern as safe in a way that could mislead people who rely on it.

A rule that misses a case, or fires where it shouldn't, is a normal bug. Open an issue for it.

The vulnerable code in the test files is deliberate. Each file is a sample for a rule test, and none of it runs anywhere.
