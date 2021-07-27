####Error example:
```json
{
  "ok": false,
  "code": 400031,
  "msg": "Invalid date.",
  "data": {}
}
```

###400:
- 400000: Invalid params
```json
[{
  "field": "date",
  "reason": "required"
}]
```
- 400000: Example for totp login
```json
[{
    "field": "totp",
    "reason": "required | invalid"
}]
```

### 401:
- 401000: Missing Authorization (no bearer token or Authorization header)
- 401001: Token expired
- 401002: Token invalid
- 401003: Session not found
