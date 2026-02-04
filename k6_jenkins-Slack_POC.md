# k6 + Jenkins + Slack POC (Downloadable HTML Report)

This guide lets anyone reproduce the same POC **from scratch**: Jenkins pulls code from GitHub, runs k6, generates an **HTML report**, archives it as a Jenkins artifact, and posts a **download link** to Slack.

---

## 1) What you’re building

**Flow:** GitHub → Jenkins Pipeline → k6 → `report_*.html` → Jenkins Artifact → Slack link

**Important:** Slack will **not** host the HTML (Slack sanitizes HTML/JS). Slack only shares the **Jenkins artifact URL**.

**Two concrete examples**
- Example A: Build #12 report link becomes `http://<jenkins-host>/job/poc_k6/12/artifact/report_2026-02-04T10-20-01.html`
- Example B: Build #13 report link becomes `http://<jenkins-host>/job/poc_k6/13/artifact/report_2026-02-04T11-05-44.html`

---

## 2) Prerequisites

- Ubuntu **20.04 or 22.04**
- Inbound access to Jenkins **:8080** (or via reverse proxy)
- A GitHub repo containing `Jenkinsfile` + k6 scripts
- Slack workspace admin access (to create Slack App) OR existing Slack App bot token

---

## 3) Install Jenkins (Ubuntu 20.04/22.04)

### 3.1 Update packages
```bash
sudo apt update
```

### 3.2 Install Java (your doc uses Java 21)
```bash
sudo apt install -y fontconfig openjdk-21-jre
java -version
```

### 3.3 Install Jenkins
```bash
sudo install -m 0755 -d /etc/apt/keyrings

sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc   https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key

echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" |   sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins
```

### 3.4 Open Jenkins in browser
```text
http://<server-ip>:8080
```

### 3.5 Get the initial admin password
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

**Two concrete examples**
- Example A: If server IP is `13.234.10.55` → `http://13.234.10.55:8080`
- Example B: If using DNS `jenkins.mycompany.in` → `http://jenkins.mycompany.in:8080`

---

## 4) Install k6 (Ubuntu)

```bash
sudo apt update
sudo apt install -y gnupg ca-certificates

curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" |   sudo tee /etc/apt/sources.list.d/k6.list

sudo apt update
sudo apt install -y k6
k6 version
```

---

## 5) Slack App + Jenkins Slack plugin (minimum working setup)

### 5.1 Create Slack App (or use existing)
- Create a Slack App in your workspace
- Add **Bot Token Scope**:
  - `chat:write`
- Install the app to your workspace
- Copy the **Bot User OAuth Token** (starts with `xoxb-...`)

**Two concrete examples**
- Example A: token looks like `xoxb-1234567890-0987654321-abcdef...`
- Example B: scope list should include only `chat:write` (more scopes = more risk)

### 5.2 Add Slack token in Jenkins Credentials
Jenkins → **Manage Jenkins** → **Credentials** → **Add Credentials**
- Kind: **Secret text**
- Secret: `xoxb-********`
- ID: `slack-bot-token` (remember this)

### 5.3 Configure Slack plugin in Jenkins
Jenkins → **Manage Jenkins** → **Configure System** → **Slack**
- Workspace: your Slack workspace
- Default channel: `#all-poc-k6` (or your channel)
- Credential: choose `slack-bot-token`
- App name: your Slack app name
- Click **Test Connection**
- Save

---

## 6) GitHub repo structure (must match)

```text
poc/
├── Jenkinsfile
├── script.js
├── options.js
└── README.md
```

---

## 7) Critical: how the HTML report is generated

Your Jenkinsfile expects a file matching:
```text
report_*.html
```

k6 by default **does not** automatically create HTML reports.  
So your `script.js` must generate it (commonly via `handleSummary()` or a formatter).

**Two concrete examples**
- Example A: write `report_2026-02-04T10-20-01.html` to the workspace root
- Example B: write `report_2026-02-04T11-05-44.html` to the workspace root

> If you already have a working `script.js` that creates `report_*.html`, keep it.  
> If you don’t, your pipeline will fail at “Collect Report” with “No HTML report found”.

---

## 8) Create Jenkins Pipeline job (from scratch)

1. Jenkins Dashboard → **New Item**
2. Enter name: `poc_k6`
3. Choose: **Pipeline**
4. Under **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/<user>/poc.git`
   - Branch: `main`
5. Save
6. Click **Build Now**

**Two concrete examples**
- Example A: Repo URL `https://github.com/nvishnuvardhan06/poc.git`
- Example B: Branch `main` (if your branch is `master`, set `master`)

---

## 9) Jenkinsfile (working version used in this POC)

Put this in `Jenkinsfile`:

```groovy
pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    REPORT_FILE = ""
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify k6') {
      steps {
        sh 'k6 version'
      }
    }

    stage('Run k6 Test') {
      steps {
        sh """
          set -e
          echo 'Running k6 load test...'
          k6 run script.js
        """
      }
    }

    stage('Collect Report') {
      steps {
        script {
          REPORT_FILE = sh(
            script: "ls -t report_*.html | head -n 1",
            returnStdout: true
          ).trim()

          if (!REPORT_FILE) {
            error "No HTML report found"
          }

          echo "Found report: ${REPORT_FILE}"

          archiveArtifacts(
            artifacts: REPORT_FILE,
            fingerprint: true,
            allowEmptyArchive: false
          )
        }
      }
    }
  }

  post {

    success {
      script {
        def reportUrl = "${env.BUILD_URL}artifact/${REPORT_FILE}"

        slackSend(
          channel: "#all-poc-k6",
          message: """[k6 POC PASSED]
Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Report: ${reportUrl}
"""
        )
      }
    }

    failure {
      slackSend(
        channel: "#all-poc-k6",
        message: """[k6 POC FAILED]
Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Logs: ${env.BUILD_URL}
"""
      )
    }
  }
}
```

---

## 10) What “success” looks like

Success means **all** of this happens:

1. Jenkins build finishes green
2. Jenkins build page shows artifact: `report_*.html`
3. Slack message contains clickable URL
4. Clicking URL downloads the HTML report (colors + charts visible)

---

## 11) Common failures (real causes)

### Failure A: “No HTML report found”
**Cause:** `script.js` did not generate `report_*.html` in the workspace.  
**Fix:** Update `script.js` to produce the HTML report file in the repo/workspace root.

### Failure B: Slack message has link but link doesn’t open
**Cause:** Jenkins requires login / VPN / firewall blocks 8080.  
**Fix:** Provide access (VPN / reverse proxy / auth), or host reports elsewhere.

### Failure C: Slack send fails
**Cause:** Slack token wrong, scope missing, channel name wrong, or plugin misconfigured.  
**Fix:** Test connection in Jenkins Slack config and confirm `chat:write`.

---

## 12) Final rules (keep it reproducible)

- Do not upload HTML to Slack.
- Always archive reports in Jenkins.
- Keep everything in Git (no manual server changes).

**POC complete.**
