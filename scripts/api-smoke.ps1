Param(
  [string]$BaseUrl = "http://localhost:8000/api",
  [switch]$VerboseHttp
)

$ErrorActionPreference = "Stop"

function Strip-Bom([string]$s) {
  if ($null -eq $s) { return $s }
  return $s.TrimStart([char]0xFEFF, [char]0xEF, [char]0xBB, [char]0xBF)
}

function Invoke-Api {
  param(
    [Parameter(Mandatory)][ValidateSet("GET","POST","PUT","DELETE")] [string]$Method,
    [Parameter(Mandatory)][string]$Path,
    [object]$Body,
    [string]$Token,
    [string]$ContentType = "application/json"
  )

  $uri = ($BaseUrl.TrimEnd("/") + "/" + $Path.TrimStart("/"))
  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }

  $bodyJson = $null
  if ($null -ne $Body) {
    $bodyJson = ($Body | ConvertTo-Json -Depth 20)
  }

  if ($VerboseHttp) {
    Write-Host "-> $Method $uri"
    if ($bodyJson) { Write-Host "   body: $bodyJson" }
  }

  try {
    $resp = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $uri -Headers $headers -ContentType $ContentType -Body $bodyJson
    $text = Strip-Bom $resp.Content
    $json = $null
    if ($text) {
      try { $json = $text | ConvertFrom-Json } catch { $json = $text }
    }
    return [pscustomobject]@{ ok=$true; status=$resp.StatusCode; json=$json; raw=$text }
  } catch {
    $status = $null
    $raw = $null
    if ($_.Exception.Response) {
      try { $status = [int]$_.Exception.Response.StatusCode } catch {}
      try {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $raw = Strip-Bom ($sr.ReadToEnd())
      } catch {}
    }
    $json = $null
    if ($raw) { try { $json = $raw | ConvertFrom-Json } catch { $json = $raw } }
    return [pscustomobject]@{ ok=$false; status=$status; json=$json; raw=$raw; error=$_.Exception.Message }
  }
}

function Assert-Ok($name, $resp, [int[]]$AllowStatus = @(200)) {
  $ok = $resp.ok -and ($AllowStatus -contains $resp.status)
  $msg = $null
  if (-not $ok) {
    $msg = if ($resp.json -and $resp.json.message) { $resp.json.message } else { $resp.error }
  }
  [pscustomobject]@{
    name=$name
    ok=$ok
    status=$resp.status
    message=$msg
  }
}

Write-Host "API smoke starting: $BaseUrl"

# --- Health
$results = @()
$results += Assert-Ok "ws-test" (Invoke-Api GET "/ws-test")

# --- Auth (create a fresh user, then login as user + admin)
$rand = -join ((97..122) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$userEmail = "smoke_$rand@example.com"
$userPass = "Password123!"
$userName = "smoke_$rand"

$register = Invoke-Api POST "/auth/register" @{
  username=$userName
  email=$userEmail
  password=$userPass
  password_confirmation=$userPass
  gender="male"
  agreed_to_terms=$true
  interests=@("tech")
}
$results += Assert-Ok "auth/register" $register @(200)

$loginUser = Invoke-Api POST "/auth/login" @{ email=$userEmail; password=$userPass }
$results += Assert-Ok "auth/login(user)" $loginUser @(200)
$userToken = $loginUser.json.access_token

$loginAdmin = Invoke-Api POST "/auth/login" @{ email="admin@chitchat.com"; password="admin123" }
$results += Assert-Ok "auth/login(admin)" $loginAdmin @(200)
$adminToken = $loginAdmin.json.access_token

$results += Assert-Ok "auth/me(user)" (Invoke-Api GET "/auth/me" $null $userToken) @(200)
$results += Assert-Ok "auth/verify(user)" (Invoke-Api GET "/auth/verify" $null $userToken) @(200)

# --- User
$results += Assert-Ok "user/profile" (Invoke-Api GET "/user/profile" $null $userToken) @(200)
$results += Assert-Ok "user/history" (Invoke-Api GET "/user/history" $null $userToken) @(200)
$results += Assert-Ok "user/status" (Invoke-Api POST "/user/status" @{ is_online=$true } $userToken) @(200,422)

# --- Friends / block / report (best-effort; allow 422 for "already ...")
$adminId = $loginAdmin.json.user.id
$results += Assert-Ok "friends(list)" (Invoke-Api GET "/friends" $null $userToken) @(200)
$results += Assert-Ok "friends/request" (Invoke-Api POST "/friends/request" @{ user_id=$adminId } $userToken) @(200,422)
$results += Assert-Ok "blocked(list)" (Invoke-Api GET "/blocked" $null $userToken) @(200)
$results += Assert-Ok "block" (Invoke-Api POST "/block" @{ user_id=$adminId } $userToken) @(200,422)
$results += Assert-Ok "unblock" (Invoke-Api POST "/unblock" @{ user_id=$adminId } $userToken) @(200,422)
$results += Assert-Ok "report" (Invoke-Api POST "/report" @{ user_id=$adminId; type="spam"; reason="smoke test" } $userToken) @(200,422)

# --- Chat (need two users to match)
$loginUser2 = Invoke-Api POST "/auth/login" @{ email="test@example.com"; password="password" }
$results += Assert-Ok "auth/login(testuser)" $loginUser2 @(200)
$token2 = $loginUser2.json.access_token

$search1 = Invoke-Api POST "/chat/search" @{ type="text"; interests=@() } $userToken
$results += Assert-Ok "chat/search(user)" $search1 @(200)
$search2 = Invoke-Api POST "/chat/search" @{ type="text"; interests=@() } $token2
$results += Assert-Ok "chat/search(testuser)" $search2 @(200)

$active1 = Invoke-Api GET "/chat/active" $null $userToken
$active2 = Invoke-Api GET "/chat/active" $null $token2
$results += Assert-Ok "chat/active(user)" $active1 @(200)
$results += Assert-Ok "chat/active(testuser)" $active2 @(200)

$chat = $active1.json.chat
if ($chat -and $chat.id) {
  $chatId = [int]$chat.id
  $results += Assert-Ok "chat/message" (Invoke-Api POST "/chat/message" @{ chat_id=$chatId; content="smoke hello" } $userToken) @(200,422,403)
  $results += Assert-Ok "chat/typing" (Invoke-Api POST "/chat/typing" @{ chat_id=$chatId; is_typing=$true } $userToken) @(200,422,403)
  $results += Assert-Ok "chat/messages" (Invoke-Api GET "/chat/messages/$chatId" $null $userToken) @(200)
  $results += Assert-Ok "chat/add-friend" (Invoke-Api POST "/chat/add-friend" @{ chat_id=$chatId } $userToken) @(200,422,403,404)

  # WebRTC signaling endpoints (success expected if chat is active)
  $results += Assert-Ok "signaling/offer" (Invoke-Api POST "/signaling/offer" @{ chat_id=$chatId; sdp="fake_sdp"; type="offer" } $userToken) @(200,422,403,404)
  $results += Assert-Ok "signaling/answer" (Invoke-Api POST "/signaling/answer" @{ chat_id=$chatId; sdp="fake_sdp"; type="answer" } $userToken) @(200,422,403,404)
  $results += Assert-Ok "signaling/ice-candidate" (Invoke-Api POST "/signaling/ice-candidate" @{ chat_id=$chatId; candidate="fake_candidate" } $userToken) @(200,422,403,404)
  $results += Assert-Ok "signaling/toggle-media" (Invoke-Api POST "/signaling/toggle-media" @{ chat_id=$chatId; media_type="audio"; enabled=$false } $userToken) @(200,422,403,404)
  $results += Assert-Ok "signaling/screen-share" (Invoke-Api POST "/signaling/screen-share" @{ chat_id=$chatId; active=$false } $userToken) @(200,422,403,404)

  $results += Assert-Ok "chat/end" (Invoke-Api POST "/chat/end" @{ chat_id=$chatId; reason="user_left" } $userToken) @(200,422,403)
  $results += Assert-Ok "chat/skip" (Invoke-Api POST "/chat/skip" @{ chat_id=$chatId } $userToken) @(200,422,403)
} else {
  $results += [pscustomobject]@{ name="chat(flow)"; ok=$false; status=$null; message="No active chat created; matching may require Redis/websockets or more users" }
}

# --- Admin
$results += Assert-Ok "admin/dashboard" (Invoke-Api GET "/admin/dashboard" $null $adminToken) @(200)
$results += Assert-Ok "admin/users" (Invoke-Api GET "/admin/users" $null $adminToken) @(200)
$results += Assert-Ok "admin/reports" (Invoke-Api GET "/admin/reports" $null $adminToken) @(200)
$results += Assert-Ok "admin/moderation-logs" (Invoke-Api GET "/admin/moderation-logs" $null $adminToken) @(200)

$failures = $results | Where-Object { -not $_.ok }

Write-Host ""
Write-Host "Summary:"
($results | Select-Object ok,name,status,message) | Format-Table -AutoSize

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "FAILED:"
  ($failures | Select-Object ok,name,status,message) | Format-Table -AutoSize
  exit 1
}

Write-Host ""
Write-Host "All checks passed."
