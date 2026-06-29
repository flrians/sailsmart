---
name: feedback-html-previews
description: HTML mockups go in previews/ and always get a file:// link output
metadata:
  type: feedback
---

Always save HTML mockups and previews to the `previews/` directory and output a clickable `file://` link so Florian can open directly in browser.

**Why:** Florian's workflow — he opens the link immediately to review without needing to navigate to the file.

**How to apply:** After writing any HTML preview file, always end the response with the `file:///Users/florianstefanides/projects2/SailSmart/previews/[filename].html` link.
