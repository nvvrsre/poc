# 🚀 k6 + Jenkins + Slack Integration POC

This document explains **exactly** how to reproduce the k6 + Jenkins + Slack POC with a **downloadable HTML report**.

---

## Architecture

GitHub → Jenkins → k6 → HTML Report → Jenkins Artifact → Slack Link

Slack **does not host** the HTML file.  
Slack only shares a **Jenkins download link**, which preserves colors & charts.

---

## Prerequisites

- Ubuntu 20.04 / 22.04
- Jenkins
- k6
- GitHub account
- Slack workspace (Admin access)

---

## Install k6

```bash
sudo apt update
sudo apt install -y gnupg ca-certificates
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install -y k6
k6 version
```

---

## Install Jenkins

```bash
sudo apt install -y openjdk-17-jdk
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins
```

Access Jenkins:
```
http://<server-ip>:8080
```

---

## Git Repository Structure

```
poc/
├── Jenkinsfile
├── script.js
├── options.js
└── README.md
```

---

## Jenkins Job Setup

- Job type: **Pipeline**
- SCM: **Git**
- Repo: `https://github.com/<user>/poc.git`
- Branch: `main`

---

## Slack Setup (IMPORTANT)

### Slack App Scopes

Only **ONE scope required**:

```
chat:write
```

❌ Do NOT upload HTML to Slack  
❌ Do NOT use files.upload  
✅ Always link Jenkins artifact

---

## Jenkins Credentials

Create Secret Text:

- ID: `slack-bot-token`
- Value: `xoxb-********`

---

## How Report Download Works

1. k6 generates:
   ```
   report_YYYY-MM-DDTHH-MM-SS.html
   ```
2. Jenkins archives it:
   ```
   archiveArtifacts artifacts: report_*.html
   ```
3. Slack message includes:
   ```
   http://jenkins/job/poc_k6/<build>/artifact/report_*.html
   ```

User clicks → Browser downloads → Full colors & charts visible.

---

## Why Slack Upload Does NOT Work

| Reason | Explanation |
|-----|-----|
| HTML blocked | Slack sanitizes HTML |
| JS disabled | Charts break |
| API limits | File upload complexity |
| Security | Jenkins is correct host |

---

## Final Outcome

✔ k6 automated  
✔ Jenkins CI  
✔ Rich HTML report  
✔ Downloadable from Slack  
✔ Enterprise-grade solution  

---

**POC Complete.**
