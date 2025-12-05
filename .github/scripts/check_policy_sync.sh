#!/usr/bin/env bash
set -euo pipefail

GUA=".coding-standards/TASKBOT_GUARDIAN.md"
COP=".github/copilot-instructions.md"

if [ ! -f "$GUA" ]; then
  echo "ERROR: canonical file $GUA not found."
  exit 1
fi

# بررسی وجود بلوک SQL ایندکس‌ها در canonical و copilot
grep -n "CREATE INDEX IF NOT EXISTS" "$GUA" > /tmp/gua_idx || true
grep -n "CREATE INDEX IF NOT EXISTS" "$COP" > /tmp/cop_idx || true

if ! cmp -s /tmp/gua_idx /tmp/cop_idx; then
  echo "ERROR: Index list differs between TASKBOT_GUARDIAN and copilot-instructions."
  echo "Please sync the index SQL blocks from $GUA into $COP"
  exit 1
fi

# بررسی پیام‌های فارسی نمونه (مثله "تسک با موفقیت ایجاد شد")
grep -n "تسک با موفقیت ایجاد شد" "$GUA" > /tmp/gua_toast || true


echo "OK: TASKBOT_GUARDIAN canonical snippets are in sync with other policy files."
exit 0
