pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
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
        sh '''
          set -e
          echo "Running k6 load test..."
          ls -l
          k6 run script.js
        '''
      }
    }
  }

  post {

    always {
      script {
        def reportFile = sh(
          script: "ls -1 report_*.html 2>/dev/null | sort | tail -n 1 || true",
          returnStdout: true
        ).trim()

        if (reportFile) {
          echo "Found report: ${reportFile}"
          env.REPORT_FILE = reportFile
          archiveArtifacts artifacts: reportFile, fingerprint: true
        } else {
          echo "No HTML report found"
        }
      }
    }

    success {
      script {
        def reportLink = env.REPORT_FILE
          ? "${env.BUILD_URL}artifact/${env.REPORT_FILE}"
          : "No report generated"

        if (env.REPORT_FILE) {
          withCredentials([string(credentialsId: 'slack-bot-token', variable: 'SLACK_TOKEN')]) {
            sh '''
              set -e

              FILE_NAME="${REPORT_FILE}"
              FILE_SIZE=$(stat -c%s "$FILE_NAME")
              CHANNEL_ID="C0ACKM8BR7G"

              echo "Requesting Slack upload URL..."

              JSON_PAYLOAD=$(printf '{
                "filename": "%s",
                "length": %s
              }' "$FILE_NAME" "$FILE_SIZE")

              RESPONSE=$(curl -s -X POST https://slack.com/api/files.getUploadURLExternal \
                -H "Authorization: Bearer $SLACK_TOKEN" \
                -H "Content-Type: application/json; charset=utf-8" \
                --data-binary "$JSON_PAYLOAD")

              echo "$RESPONSE"

              UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.upload_url')
              FILE_ID=$(echo "$RESPONSE" | jq -r '.file_id')

              if [ "$UPLOAD_URL" = "null" ] || [ "$FILE_ID" = "null" ]; then
                echo "Slack failed to provide upload URL"
                exit 1
              fi

              echo "Uploading file to Slack..."
              curl -s -X PUT "$UPLOAD_URL" \
                -H "Content-Type: application/octet-stream" \
                --data-binary @"$FILE_NAME"

              echo "Completing Slack upload..."
              curl -s -X POST https://slack.com/api/files.completeUploadExternal \
                -H "Authorization: Bearer $SLACK_TOKEN" \
                -H "Content-Type: application/json; charset=utf-8" \
                --data-binary "$(printf '{
                  "files": [{
                    "id": "%s",
                    "title": "k6 HTML Test Report"
                  }],
                  "channel_id": "%s"
                }' "$FILE_ID" "$CHANNEL_ID")"
            '''
          }
        }

        slackSend(
          channel: "#all-poc-k6",
          message: """✅ *k6 POC PASSED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Jenkins Report Link: ${reportLink}

ℹ️ The HTML report is uploaded above. Download it and open in a browser to see full colors & charts.
"""
        )
      }
    }

    failure {
      slackSend(
        channel: "#all-poc-k6",
        message: """❌ *k6 POC FAILED*
• Job: ${env.JOB_NAME}
• Build: ${env.BUILD_NUMBER}
• Logs: ${env.BUILD_URL}
"""
      )
    }
  }
}
