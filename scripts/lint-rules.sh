#!/bin/sh
# Lint the rules with the rule-lint pack from semgrep/semgrep-rules, pinned to one
# commit so results do not change under us. The slow-pattern checks are skipped.
# They are performance heuristics that also flag the Express handler and
# focus-metavariable patterns that the taint rules here depend on.
set -eu

LINTS_SHA=16b9e6d45f10649f6a531ec4838ed9924372c3bc
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

git -C "$work" init -q
git -C "$work" remote add origin https://github.com/semgrep/semgrep-rules.git
git -C "$work" fetch -q --depth 1 origin "$LINTS_SHA"
git -C "$work" checkout -q FETCH_HEAD -- yaml/semgrep

lints="$work/yaml/semgrep"
find "$lints" -name '*.test.yaml' -delete
rm -f "$lints"/slow-pattern-*.yaml

semgrep scan --metrics=off --error --quiet --config "$lints" --exclude='*.test.yaml' rules/
echo "Rule lint passed."
