# semgrep-rules

[![ci](https://github.com/KhalidSharafEl-Din/semgrep-rules/actions/workflows/ci.yml/badge.svg)](https://github.com/KhalidSharafEl-Din/semgrep-rules/actions/workflows/ci.yml)

Ten custom Semgrep rules for bugs the community registry misses in GitHub Actions workflows and in Node.js and Python web backends. Each rule has a test file with vulnerable and safe samples, and CI runs every test on each push and pull request.

I picked these from bug classes I run into when triaging pipeline findings and testing web and mobile backends. Before writing a rule, I checked the [semgrep/semgrep-rules](https://github.com/semgrep/semgrep-rules) repository at commit `16b9e6d` (October 2026) and kept only rules that catch something it doesn't. The `registry-comparison` field in each rule's metadata names the closest community rule and what it misses.

## Rules

| ID | Language | CWE | What it catches |
| :-- | :-- | :-- | :-- |
| [`gha-untrusted-input-to-github-env`](rules/github-actions/gha-untrusted-input-to-github-env.yaml) | GitHub Actions | CWE-77 | Event data that a step moves into `env:` and then writes to `$GITHUB_ENV` or `$GITHUB_PATH`. A newline in the value sets variables such as `BASH_ENV` for every later step. |
| [`gha-privileged-trigger-checks-out-pr-code`](rules/github-actions/gha-privileged-trigger-checks-out-pr-code.yaml) | GitHub Actions | CWE-829 | `pull_request_target`, `issue_comment` and `workflow_run` workflows that fetch pull request code, including `refs/pull/<n>/merge`, `gh pr checkout` and `git fetch ... pull/...`. |
| [`fastapi-ssrf`](rules/python/fastapi/fastapi-ssrf.yaml) | Python | CWE-918 | FastAPI route parameters that reach the URL of a `requests`, `httpx`, `aiohttp` or `urllib` call. |
| [`fastapi-jinja2-ssti`](rules/python/fastapi/fastapi-jinja2-ssti.yaml) | Python | CWE-1336 | FastAPI route parameters used as the source of a Jinja2 template. |
| [`python-jwt-claim-validation-disabled`](rules/python/jwt/python-jwt-claim-validation-disabled.yaml) | Python | CWE-613, CWE-1390 | PyJWT and python-jose calls that turn off `verify_exp`, `verify_aud`, `verify_iss` or another claim check. |
| [`python-pickle-based-model-load`](rules/python/deserialization/python-pickle-based-model-load.yaml) | Python | CWE-502 | `torch.load` without `weights_only=True`, `numpy.load(allow_pickle=True)`, `joblib.load` and `pandas.read_pickle`. |
| [`drf-anonymous-write-endpoint`](rules/python/django-rest-framework/drf-anonymous-write-endpoint.yaml) | Python | CWE-862, CWE-639 | Django REST Framework views that can update or delete objects but set `AllowAny` or empty permission classes. |
| [`jsonwebtoken-verify-callback-ignores-error`](rules/javascript/jsonwebtoken/jsonwebtoken-verify-callback-ignores-error.yaml) | JavaScript, TypeScript | CWE-347, CWE-754 | `jwt.verify()` callbacks that never read their error argument or check the payload, so a forged or expired token can get through. |
| [`express-mass-assignment`](rules/javascript/express/express-mass-assignment.yaml) | JavaScript, TypeScript | CWE-915 | The whole `req.body` passed to a Mongoose, Sequelize or Prisma write. |
| [`express-mongodb-operator-injection`](rules/javascript/express/express-mongodb-operator-injection.yaml) | JavaScript, TypeScript | CWE-943 | `req.body` or `req.query` values in a MongoDB filter without a cast, which lets a client send `{"$ne": null}`. |

Every rule sets `cwe`, `owasp`, `confidence`, `likelihood`, `impact` and `references` in its metadata. The FastAPI, Express mass assignment and MongoDB rules use taint mode. The others use pattern matching.

Each message says what's wrong, why it matters and how to fix it, with a code example where one fits.

## Smoke test on OWASP Juice Shop

I ran the pack against [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) at commit `717f5ef`. In `routes/`, the MongoDB rule reported five lines where a request body value reaches a MarsDB filter without a cast. One of them is the line Juice Shop labels `noSqlReviewsChallenge`. Juice Shop also ships three candidate fixes for that bug in `data/static/codefixes/`. The rule flags the two marked as wrong and stays quiet on the one marked correct, which rejects non-string IDs with a `typeof` check.

That result took two changes to the rule after the first run. It now skips Sequelize queries, which this attack doesn't affect, and it accepts `typeof` guards. Both cases have tests. The other nine rules reported nothing in Juice Shop.

## What the tests prove

`semgrep --test` checks that every line marked `ruleid:` produces a finding and every line marked `ok:` doesn't. So the tests prove each rule behaves as described on the samples in this repository. I haven't measured false-positive rates on real codebases. Lines marked `todook:` are known false positives that a rule still reports. The two in the `$GITHUB_ENV` rule come from a Semgrep limit: it can't link a YAML `env:` key to the exact line of shell that writes the file.

## Run the rules locally

Install Semgrep (the rules are tested with 1.184.0), clone this repository and point Semgrep at the `rules/` folder:

```sh
pipx install semgrep
git clone https://github.com/KhalidSharafEl-Din/semgrep-rules.git
semgrep scan --metrics=off --config semgrep-rules/rules/ path/to/your/code
```

To run one rule, pass its file instead, for example `--config semgrep-rules/rules/python/fastapi/fastapi-ssrf.yaml`.

To check the rules themselves, run these from the repository root:

```sh
semgrep --validate --metrics=off --config rules/
semgrep --test --metrics=off rules/
sh scripts/lint-rules.sh
```

The lint script runs the rule-lint pack from semgrep/semgrep-rules, pinned to one commit. It skips the slow-pattern checks, which also flag the source patterns the taint rules need.

## Run the rules in GitHub Actions

This workflow checks out your code and this rule pack, both pinned, and fails the job when a rule fires. Replace `<commit-sha>` with a commit from this repository so the rules can't change without a pull request on your side.

```yaml
name: semgrep

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  semgrep:
    runs-on: ubuntu-latest
    container:
      image: semgrep/semgrep:1.184.0@sha256:cc1b68266f267878b39739373ea9985b9a78e5d64497dd875c8de100b22695ed
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          repository: KhalidSharafEl-Din/semgrep-rules
          ref: <commit-sha>
          path: .semgrep-rules
          persist-credentials: false
      - run: semgrep scan --metrics=off --error --config .semgrep-rules/rules/ --exclude=.semgrep-rules
```

`--exclude=.semgrep-rules` keeps Semgrep from scanning the deliberately vulnerable test samples in this repository.

## Use with ci-security-pipeline

[ci-security-pipeline](https://github.com/KhalidSharafEl-Din/ci-security-pipeline) is a reusable workflow that runs Semgrep, OSV-Scanner and Gitleaks behind one gate. It takes an optional extra rule pack, so you can run these rules next to the registry rulesets:

```yaml
jobs:
  security:
    uses: KhalidSharafEl-Din/ci-security-pipeline/.github/workflows/security.yml@<pipeline-commit-sha>
    permissions:
      contents: read
      security-events: write
      actions: read
    with:
      semgrep-config: p/default
      semgrep-extra-rules-repo: KhalidSharafEl-Din/semgrep-rules
      semgrep-extra-rules-ref: <rules-commit-sha>
      semgrep-extra-rules-path: rules
```

Check that repository's README for the current input names before you copy this. With the pipeline's default threshold, `ERROR` findings fail the gate and `WARNING` findings show up in the report without failing it. `gha-privileged-trigger-checks-out-pr-code` also reports the cases the community `pull-request-target-code-checkout` rule covers, so expect a duplicate finding for those if your configs include both.

## Suppress a finding

When a finding is safe in your code, add a `nosemgrep` comment on the reported line with the rule ID and the reason:

```python
model = torch.load(path)  # nosemgrep: python-pickle-based-model-load -- file is built by our own pipeline and stored read-only
```

If a rule is wrong in a way that would affect other code too, please open an issue with a short sample.

## Repository layout

```text
rules/
  github-actions/      workflow rules, tests in <rule>.test.yaml
  javascript/          Express and jsonwebtoken rules, tests in <rule>.js
  python/              FastAPI, Django REST Framework, JWT and deserialization rules, tests in <rule>.py
scripts/lint-rules.sh  runs the semgrep-rules lint pack
```

Each rule sits next to its test file, which is how `semgrep --test` pairs them.

## Contributing, security and license

[CONTRIBUTING.md](CONTRIBUTING.md) explains how to add a rule with tests. To report a security problem, see [SECURITY.md](SECURITY.md). The rules are released under the [MIT license](LICENSE).
