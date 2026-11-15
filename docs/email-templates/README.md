# Sign-in emails

Supabase > Authentication > Emails. Each file's first line names its tab
and subject:

| Tab | File | Subject |
|---|---|---|
| Magic link (returning users) | `magic-link.html` | `Your CreditDash sign-in code: {{ .Token }}` |
| Confirm signup (first sign-in) | `confirm-signup.html` | `Welcome to CreditDash. Your code: {{ .Token }}` |

Both must keep `{{ .Token }}`: the sign-in page asks for the 6-digit code,
and a phone's mail app often opens the link in a different browser, where
the link cannot finish signing in.
